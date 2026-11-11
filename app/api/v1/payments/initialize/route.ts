import { fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { prisma } from "@/lib/db";
import {
  initializePaystackTransaction,
  markOrderPaid,
  paystackConfigured,
  verifyPaystackTransaction,
} from "@/lib/payments";
import { appUrl } from "@/lib/email";

export async function POST(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const { auth } = guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const orderId = (body as { orderId?: unknown }).orderId;
  if (typeof orderId !== "string" || !orderId) {
    return fail("VALIDATION_ERROR", "Choose an order to pay.", 422);
  }

  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: auth.user.id },
    select: { id: true, orderNumber: true, status: true, totalPesewas: true },
  });
  if (!order) return fail("NOT_FOUND", "Order not found.", 404);
  if (order.status !== "PENDING_PAYMENT") {
    return fail("CONFLICT", "This order is not awaiting payment.", 409);
  }

  if (!paystackConfigured()) {
    return fail(
      "PROVIDER_UNAVAILABLE",
      "Online payments are not configured on this deployment.",
      503,
    );
  }

  const existingPayment = await prisma.payment.findFirst({
    where: { orderId: order.id, status: { in: ["PENDING", "INITIATED"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, providerReference: true, status: true },
  });

  if (existingPayment) {
    try {
      const result = await initializePaystackTransaction({
        email: auth.user.email,
        amountPesewas: order.totalPesewas,
        reference: existingPayment.providerReference,
        callbackUrl: `${appUrl()}/api/v1/payments/callback`,
        metadata: { orderId: order.id, orderNumber: order.orderNumber, userId: auth.user.id },
      });
      return ok({
        authorizationUrl: result.authorizationUrl,
        reference: result.reference,
        paymentId: existingPayment.id,
      });
    } catch (error) {
      await prisma.payment.update({
        where: { id: existingPayment.id },
        data: { status: "FAILED", rawPayloadJson: { error: String(error) } },
      });
      return fail("PAYMENT_FAILED", "Paystack could not start this payment. Try again.", 502);
    }
  }

  const reference = `CM-${order.orderNumber}-${Date.now().toString(36).toUpperCase()}`;
  const payment = await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "PAYSTACK",
      providerReference: reference,
      amountPesewas: order.totalPesewas,
      currency: "GHS",
      status: "INITIATED",
      idempotencyKey: `${order.id}:${reference}`,
    },
    select: { id: true, providerReference: true },
  });

  try {
    const result = await initializePaystackTransaction({
      email: auth.user.email,
      amountPesewas: order.totalPesewas,
      reference,
      callbackUrl: `${appUrl()}/api/v1/payments/callback`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber, userId: auth.user.id },
    });
    return ok({
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
      paymentId: payment.id,
    });
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", rawPayloadJson: { error: String(error) } },
    });
    return fail("PAYMENT_FAILED", "Paystack could not start this payment. Try again.", 502);
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference");
  if (!reference) return fail("VALIDATION_ERROR", "Missing payment reference.", 422);
  if (!paystackConfigured()) {
    return fail(
      "PROVIDER_UNAVAILABLE",
      "Online payments are not configured on this deployment.",
      503,
    );
  }

  const payment = await prisma.payment.findUnique({
    where: { providerReference: reference },
    select: { id: true, orderId: true, status: true, amountPesewas: true },
  });
  if (!payment) return fail("NOT_FOUND", "Payment not found.", 404);

  if (payment.status === "SUCCEEDED") {
    return ok({ status: "SUCCEEDED", orderId: payment.orderId });
  }

  try {
    const verification = await verifyPaystackTransaction(reference);
    if (verification.status === "success") {
      await markOrderPaid({
        paymentId: payment.id,
        orderId: payment.orderId,
        raw: verification.raw,
      });
      return ok({ status: "SUCCEEDED", orderId: payment.orderId });
    }
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", rawPayloadJson: verification.raw },
    });
    return ok({ status: verification.status, orderId: payment.orderId });
  } catch {
    return fail("PROVIDER_UNAVAILABLE", "Could not verify the payment right now.", 503);
  }
}
