import { fail, ok } from "@/lib/api-response";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { writeAuditLog } from "@/lib/audit";
import {
  confirmPaymentFromVerification,
  paystackConfigured,
  verifyPaystackTransaction,
  verifyWebhookSignature,
} from "@/lib/payments";

interface PaystackEvent {
  event?: string;
  data?: { reference?: string; id?: number | string; amount?: number; currency?: string };
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return fail("FORBIDDEN", "Invalid webhook signature.", 401);
  }
  if (!paystackConfigured()) {
    return fail("PROVIDER_UNAVAILABLE", "Payments are not configured on this deployment.", 503);
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return fail("VALIDATION_ERROR", "Malformed webhook payload.", 400);
  }

  const eventId = String(event.data?.id ?? event.event ?? "unknown");
  const payload = event as unknown as Prisma.InputJsonValue;

  // Claim the event. Only a fully PROCESSED event is a true duplicate; events
  // that were received but never completed are retried.
  const claimed = await prisma.webhookEvent.upsert({
    where: { provider_eventId: { provider: "PAYSTACK", eventId } },
    create: {
      provider: "PAYSTACK",
      eventId,
      payloadJson: payload,
      status: "PROCESSING",
      attempts: 1,
    },
    update: {
      payloadJson: payload,
      status: "PROCESSING",
      attempts: { increment: 1 },
      errorMessage: null,
    },
    select: { id: true, status: true, attempts: true, processedAt: true },
  });

  if (claimed.status === "PROCESSED" && claimed.processedAt !== null) {
    return ok({ received: true, duplicate: true });
  }

  try {
    if (event.event === "charge.success") {
      const reference = event.data?.reference;
      if (!reference) {
        throw new Error("Webhook payload has no transaction reference");
      }

      const payment = await prisma.payment.findUnique({
        where: { providerReference: reference },
        select: { id: true, orderId: true, status: true },
      });
      if (!payment) {
        // Nothing to update: the event is recorded as processed so it is not retried forever.
        await prisma.webhookEvent.update({
          where: { id: claimed.id },
          data: { status: "PROCESSED", processedAt: new Date() },
        });
        return ok({ received: true, matched: false });
      }

      // The provider payload is never trusted: the transaction is verified against
      // Paystack and the verified amount, currency and reference are compared with
      // the stored payment inside confirmPaymentFromVerification.
      const verification = await verifyPaystackTransaction(reference);
      const result = await confirmPaymentFromVerification({
        paymentId: payment.id,
        verification,
        source: "webhook",
      });

      if (result.outcome === "rejected") {
        await writeAuditLog({
          action: "webhook.payment_rejected",
          entityType: "Payment",
          entityId: payment.id,
          after: { reason: result.reason, eventId },
        });
      }
    }

    await prisma.webhookEvent.update({
      where: { id: claimed.id },
      data: { status: "PROCESSED", processedAt: new Date(), errorMessage: null },
    });

    return ok({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message.slice(0, 500) : "Unknown webhook error";
    await prisma.webhookEvent.update({
      where: { id: claimed.id },
      data: { status: "FAILED", errorMessage: message },
    });
    await writeAuditLog({
      action: "webhook.processing_failed",
      entityType: "WebhookEvent",
      entityId: claimed.id,
      after: { error: message, eventId },
    });
    // Ask the provider to retry. The event stays retryable because only a fully
    // PROCESSED event is treated as a duplicate.
    return fail("INTERNAL_ERROR", "Webhook processing failed.", 500);
  }
}
