import { fail, ok } from "@/lib/api-response";
import type { Prisma } from "@/lib/generated/prisma/client";
import { prisma } from "@/lib/db";
import { markOrderPaid, verifyWebhookSignature } from "@/lib/payments";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return fail("FORBIDDEN", "Invalid webhook signature.", 401);
  }

  let event: {
    event?: string;
    data?: { reference?: string; id?: number | string };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return fail("VALIDATION_ERROR", "Malformed webhook payload.", 400);
  }

  const eventId = String(event.data?.id ?? event.event ?? "unknown");
  const existing = await prisma.webhookEvent.findUnique({
    where: { provider_eventId: { provider: "PAYSTACK", eventId } },
    select: { id: true, status: true },
  });
  if (existing) {
    return ok({ received: true, duplicate: true });
  }

  await prisma.webhookEvent.create({
    data: {
      provider: "PAYSTACK",
      eventId,
      payloadJson: event as unknown as Prisma.InputJsonValue,
      status: "RECEIVED",
    },
  });

  if (event.event === "charge.success") {
    const reference = event.data?.reference;
    if (reference) {
      const payment = await prisma.payment.findUnique({
        where: { providerReference: reference },
        select: { id: true, orderId: true, status: true },
      });
      if (payment && payment.status !== "SUCCEEDED") {
        await markOrderPaid({
          paymentId: payment.id,
          orderId: payment.orderId,
          raw: event as unknown as Prisma.InputJsonValue,
        });
      }
    }
  }

  await prisma.webhookEvent.update({
    where: { provider_eventId: { provider: "PAYSTACK", eventId } },
    data: { status: "PROCESSED", processedAt: new Date() },
  });

  return ok({ received: true });
}
