import { fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { expireStaleOrders } from "@/lib/orders";
import { initializePaystackTransaction, paystackConfigured } from "@/lib/payments";
import { appUrl } from "@/lib/email";
import { rateLimitWith } from "@/lib/rate-limit";

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

  const payLimit = await rateLimitWith(`payment-init:${auth.user.id}`, 20, {
    windowMs: 10 * 60_000,
    failClosed: false,
  });
  if (!payLimit.allowed) {
    return fail("RATE_LIMITED", "Too many payment attempts. Try again shortly.", 429);
  }

  // Close out stale unpaid orders first so a buyer cannot pay an expired order.
  await expireStaleOrders();

  const order = await prisma.order.findFirst({
    where: { id: orderId, buyerId: auth.user.id, deletedAt: null },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalPesewas: true,
      currency: true,
      buyerId: true,
    },
  });
  if (!order) return fail("NOT_FOUND", "Order not found.", 404);
  if (order.buyerId !== auth.user.id) {
    return fail("FORBIDDEN", "You can only pay for your own orders.", 403);
  }
  if (order.status !== "PENDING_PAYMENT") {
    return fail("CONFLICT", "This order is not awaiting payment.", 409);
  }
  if (!Number.isInteger(order.totalPesewas) || order.totalPesewas < 100) {
    return fail("CONFLICT", "This order has no payable amount.", 409);
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
    select: { id: true, providerReference: true, status: true, amountPesewas: true },
  });

  // The stored amount is authoritative; a payment record is never re-used when
  // the order amount changed since it was created.
  const reusable =
    existingPayment && existingPayment.amountPesewas === order.totalPesewas
      ? existingPayment
      : null;

  if (reusable) {
    try {
      const result = await initializePaystackTransaction({
        email: auth.user.email,
        amountPesewas: order.totalPesewas,
        reference: reusable.providerReference,
        callbackUrl: `${appUrl()}/api/v1/payments/callback`,
        metadata: {
          orderId: order.id,
          orderNumber: order.orderNumber,
          userId: auth.user.id,
        },
      });
      return ok({
        authorizationUrl: result.authorizationUrl,
        reference: result.reference,
        paymentId: reusable.id,
      });
    } catch (error) {
      await prisma.payment.update({
        where: { id: reusable.id },
        data: { status: "FAILED", rawPayloadJson: { error: String(error).slice(0, 300) } },
      });
      await writeAuditLog({
        actorId: auth.user.id,
        action: "payment.initialize_failed",
        entityType: "Payment",
        entityId: reusable.id,
        after: { orderId: order.id, error: String(error).slice(0, 200) },
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
      currency: order.currency,
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
    await writeAuditLog({
      actorId: auth.user.id,
      action: "payment.initialized",
      entityType: "Payment",
      entityId: payment.id,
      after: { orderId: order.id, amountPesewas: order.totalPesewas, currency: order.currency },
    });
    return ok({
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
      paymentId: payment.id,
    });
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", rawPayloadJson: { error: String(error).slice(0, 300) } },
    });
    await writeAuditLog({
      actorId: auth.user.id,
      action: "payment.initialize_failed",
      entityType: "Payment",
      entityId: payment.id,
      after: { orderId: order.id, error: String(error).slice(0, 200) },
    });
    return fail("PAYMENT_FAILED", "Paystack could not start this payment. Try again.", 502);
  }
}
