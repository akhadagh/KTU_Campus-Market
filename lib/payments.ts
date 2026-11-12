import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import type { PaymentChannel } from "@/lib/generated/prisma/enums";

const PAYSTACK_BASE = "https://api.paystack.co";
const PAYSTACK_TIMEOUT_MS = 20_000;

export function paystackSecret(): string | undefined {
  const key = process.env["PAYSTACK_SECRET_KEY"];
  return key && key.length > 0 ? key : undefined;
}

export function paystackConfigured(): boolean {
  return Boolean(paystackSecret());
}

export interface PaystackInitializeResult {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
}

export async function initializePaystackTransaction(input: {
  email: string;
  amountPesewas: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}): Promise<PaystackInitializeResult> {
  const secret = paystackSecret();
  if (!secret) throw new Error("Paystack is not configured");
  if (!Number.isInteger(input.amountPesewas) || input.amountPesewas < 100) {
    throw new Error("Payment amount is invalid");
  }

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: input.email,
      amount: input.amountPesewas,
      currency: "GHS",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
    signal: AbortSignal.timeout(PAYSTACK_TIMEOUT_MS),
  });

  const json = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: {
      authorization_url?: string;
      access_code?: string;
      reference?: string;
    };
  };

  if (!res.ok || !json.status || !json.data?.authorization_url) {
    throw new Error(json.message ?? "Paystack could not start the transaction");
  }

  return {
    authorizationUrl: json.data.authorization_url,
    accessCode: json.data.access_code ?? "",
    reference: json.data.reference ?? input.reference,
  };
}

export interface PaystackVerification {
  status: string;
  amount: number;
  currency: string;
  reference: string;
  channel: string | null;
  paidAt: string | null;
  raw: Prisma.InputJsonValue;
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerification> {
  const secret = paystackSecret();
  if (!secret) throw new Error("Paystack is not configured");

  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(PAYSTACK_TIMEOUT_MS),
  });
  const json = (await res.json().catch(() => ({}))) as {
    status?: boolean;
    message?: string;
    data?: {
      status?: string;
      amount?: number;
      currency?: string;
      reference?: string;
      channel?: string;
      paid_at?: string;
    };
  };
  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message ?? "Paystack verification failed");
  }
  return {
    status: json.data.status ?? "unknown",
    amount: json.data.amount ?? 0,
    currency: json.data.currency ?? "GHS",
    reference: json.data.reference ?? reference,
    channel: json.data.channel ?? null,
    paidAt: json.data.paid_at ?? null,
    raw: json as unknown as Prisma.InputJsonValue,
  };
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env["PAYSTACK_WEBHOOK_SECRET"];
  if (!secret || !signature) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(signature, "utf8");
  if (expectedBuffer.length !== providedBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export type PaymentRejection =
  | "payment_not_found"
  | "order_not_found"
  | "reference_mismatch"
  | "amount_mismatch"
  | "currency_mismatch"
  | "status_not_success"
  | "order_not_payable"
  | "already_paid";

export type PaymentConfirmationOutcome =
  | { outcome: "paid"; orderId: string; orderNumber: string }
  | { outcome: "already_paid"; orderId: string; orderNumber: string }
  | { outcome: "rejected"; reason: PaymentRejection; orderId?: string; orderNumber?: string }
  | { outcome: "ignored"; reason: string };

/**
 * Single authoritative place where a payment may mark an order as paid.
 *
 * Every path (browser callback, provider webhook, manual verification) must:
 *  - compare the provider's verified reference, amount and currency with the
 *    stored payment record,
 *  - require the provider transaction status to be "success",
 *  - require the order to still be awaiting payment,
 *  - apply the state change atomically so concurrent callbacks cannot double
 *    apply stock deductions or notifications.
 */
export async function confirmPaymentFromVerification(input: {
  paymentId: string;
  verification: PaystackVerification;
  source: "callback" | "webhook" | "manual";
  actorId?: string | null;
}): Promise<PaymentConfirmationOutcome> {
  const payment = await prisma.payment.findUnique({
    where: { id: input.paymentId },
    select: {
      id: true,
      orderId: true,
      providerReference: true,
      amountPesewas: true,
      currency: true,
      status: true,
      provider: true,
      order: {
        select: { id: true, orderNumber: true, status: true, buyerId: true, totalPesewas: true },
      },
    },
  });
  if (!payment) {
    return { outcome: "rejected", reason: "payment_not_found" };
  }
  if (!payment.order) {
    return { outcome: "rejected", reason: "order_not_found" };
  }

  const reject = async (reason: PaymentRejection): Promise<PaymentConfirmationOutcome> => {
    await writeAuditLog({
      actorId: input.actorId ?? null,
      action: "payment.rejected",
      entityType: "Payment",
      entityId: payment.id,
      before: { status: payment.status },
      after: {
        reason,
        source: input.source,
        providerStatus: input.verification.status,
        providerAmount: input.verification.amount,
        providerCurrency: input.verification.currency,
        providerReference: input.verification.reference,
      },
    });
    return {
      outcome: "rejected",
      reason,
      orderId: payment.orderId,
      orderNumber: payment.order.orderNumber,
    };
  };

  if (payment.status === "SUCCEEDED") {
    return {
      outcome: "already_paid",
      orderId: payment.orderId,
      orderNumber: payment.order.orderNumber,
    };
  }
  if (payment.provider !== "PAYSTACK") {
    return reject("payment_not_found");
  }
  if (input.verification.reference !== payment.providerReference) {
    return reject("reference_mismatch");
  }
  if (input.verification.amount !== payment.amountPesewas) {
    return reject("amount_mismatch");
  }
  if (input.verification.currency !== payment.currency) {
    return reject("currency_mismatch");
  }
  if (input.verification.status !== "success") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", rawPayloadJson: input.verification.raw },
    });
    return reject("status_not_success");
  }
  if (payment.order.status !== "PENDING_PAYMENT") {
    return reject("order_not_payable");
  }

  const applied = await prisma
    .$transaction(async (tx) => {
      // Conditional update: only one concurrent caller can move the payment to SUCCEEDED.
      const paymentUpdate = await tx.payment.updateMany({
        where: { id: payment.id, status: { in: ["PENDING", "INITIATED", "FAILED"] } },
        data: {
          status: "SUCCEEDED",
          paidAt: new Date(),
          rawPayloadJson: input.verification.raw,
          ...(input.verification.channel
            ? { channel: input.verification.channel.toUpperCase() as PaymentChannel }
            : {}),
        },
      });
      if (paymentUpdate.count === 0) return false;

      const orderUpdate = await tx.order.updateMany({
        where: { id: payment.orderId, status: "PENDING_PAYMENT" },
        data: { status: "PAID" },
      });
      if (orderUpdate.count === 0) {
        throw new Error("Order was no longer awaiting payment");
      }

      await tx.orderStatusHistory.create({
        data: {
          orderId: payment.orderId,
          toStatus: "PAID",
          actorType: "SYSTEM",
          reason: "Payment confirmed",
        },
      });

      await tx.inventoryReservation.updateMany({
        where: { orderId: payment.orderId, status: "HELD" },
        data: { status: "CONSUMED" },
      });

      const orderItems = await tx.orderItem.findMany({
        where: { vendorOrder: { orderId: payment.orderId } },
        select: { id: true, productId: true, variantId: true, quantity: true, titleSnapshot: true },
      });

      const shortfalls: string[] = [];
      for (const item of orderItems) {
        if (item.variantId) {
          const variant = await tx.productVariant.updateMany({
            where: { id: item.variantId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (variant.count === 0) shortfalls.push(item.titleSnapshot);
        } else if (item.productId) {
          const product = await tx.product.updateMany({
            where: { id: item.productId, quantity: { gte: item.quantity } },
            data: { quantity: { decrement: item.quantity } },
          });
          if (product.count === 0) shortfalls.push(item.titleSnapshot);
        }
      }

      if (shortfalls.length > 0) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: payment.orderId,
            toStatus: "PAID",
            actorType: "SYSTEM",
            reason: `Stock review required: ${shortfalls.join(", ")}`,
          },
        });
      }

      return true;
    })
    .catch((error) => {
      if (error instanceof Error && error.message.includes("no longer awaiting payment")) {
        return false;
      }
      throw error;
    });

  if (!applied) {
    const order = await prisma.order.findUnique({
      where: { id: payment.orderId },
      select: { orderNumber: true, status: true },
    });
    if (order?.status === "PAID" || order?.status === "FULFILLED") {
      return {
        outcome: "already_paid",
        orderId: payment.orderId,
        orderNumber: order.orderNumber,
      };
    }
    return reject("order_not_payable");
  }

  await writeAuditLog({
    actorId: input.actorId ?? null,
    action: "payment.succeeded",
    entityType: "Payment",
    entityId: payment.id,
    before: { status: payment.status, orderStatus: payment.order.status },
    after: {
      status: "SUCCEEDED",
      orderStatus: "PAID",
      amountPesewas: payment.amountPesewas,
      currency: payment.currency,
      source: input.source,
    },
  });

  const vendors = await prisma.vendorOrder.findMany({
    where: { orderId: payment.orderId },
    select: { vendor: { select: { userId: true, storeName: true } } },
  });
  await Promise.all([
    createNotification({
      userId: payment.order.buyerId,
      type: "PAYMENT",
      title: "Payment received",
      body: `Order ${payment.order.orderNumber} is paid and waiting for the seller.`,
      link: "/orders",
    }),
    ...vendors.map((vendorOrder) =>
      createNotification({
        userId: vendorOrder.vendor.userId,
        type: "ORDER",
        title: "Payment confirmed",
        body: `Order ${payment.order.orderNumber} has been paid. You can start preparing it.`,
        link: "/sell/orders",
      }),
    ),
  ]);

  return { outcome: "paid", orderId: payment.orderId, orderNumber: payment.order.orderNumber };
}

export interface PaystackRefundResult {
  success: boolean;
  providerReference: string | null;
  message: string;
}

export async function initiatePaystackRefund(input: {
  reference: string;
  amountPesewas: number;
  reason: string;
}): Promise<PaystackRefundResult> {
  const secret = paystackSecret();
  if (!secret) {
    return {
      success: false,
      providerReference: null,
      message: "Refunds are not configured on this deployment.",
    };
  }
  if (!Number.isInteger(input.amountPesewas) || input.amountPesewas < 100) {
    return { success: false, providerReference: null, message: "Refund amount is invalid." };
  }

  try {
    const res = await fetch(`${PAYSTACK_BASE}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        reference: input.reference,
        amount: input.amountPesewas,
        currency: "GHS",
        reason: input.reason,
      }),
      signal: AbortSignal.timeout(PAYSTACK_TIMEOUT_MS),
    });
    const json = (await res.json().catch(() => ({}))) as {
      status?: boolean;
      message?: string;
      data?: { refund_id?: number | string; reference?: string };
    };
    if (!res.ok || !json.status) {
      return {
        success: false,
        providerReference: null,
        message: json.message ?? "Paystack could not start the refund.",
      };
    }
    return {
      success: true,
      providerReference:
        json.data?.reference ?? (json.data?.refund_id ? String(json.data.refund_id) : null),
      message: json.message ?? "Refund accepted by Paystack.",
    };
  } catch {
    return {
      success: false,
      providerReference: null,
      message: "The refund provider could not be reached.",
    };
  }
}
