import { createHmac, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { createNotification } from "@/lib/notifications";

const PAYSTACK_BASE = "https://api.paystack.co";

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
  });

  const json = (await res.json()) as {
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
  raw: Prisma.InputJsonValue;
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerification> {
  const secret = paystackSecret();
  if (!secret) throw new Error("Paystack is not configured");

  const res = await fetch(`${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const json = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: { status?: string; amount?: number; currency?: string; reference?: string };
  };
  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message ?? "Paystack verification failed");
  }
  return {
    status: json.data.status ?? "unknown",
    amount: json.data.amount ?? 0,
    currency: json.data.currency ?? "GHS",
    reference: json.data.reference ?? reference,
    raw: json,
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

export async function markOrderPaid(input: {
  paymentId: string;
  orderId: string;
  raw?: Prisma.InputJsonValue;
}): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      buyerId: true,
      totalPesewas: true,
      vendorOrders: {
        select: {
          id: true,
          vendor: { select: { userId: true, storeName: true } },
          items: { select: { productId: true, quantity: true } },
        },
      },
    },
  });
  if (!order) return;
  if (order.status === "PAID" || order.status === "FULFILLED") return;

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: input.paymentId },
      data: { status: "SUCCEEDED", paidAt: new Date(), rawPayloadJson: input.raw ?? undefined },
    });
    await tx.order.update({ where: { id: order.id }, data: { status: "PAID" } });
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        toStatus: "PAID",
        actorType: "SYSTEM",
        reason: "Payment confirmed",
      },
    });
    await tx.inventoryReservation.updateMany({
      where: { orderId: order.id, status: "HELD" },
      data: { status: "CONSUMED" },
    });
    for (const vendorOrder of order.vendorOrders) {
      for (const item of vendorOrder.items) {
        if (!item.productId) continue;
        await tx.product.updateMany({
          where: { id: item.productId, quantity: { gte: item.quantity } },
          data: { quantity: { decrement: item.quantity } },
        });
      }
    }
  });

  await createNotification({
    userId: order.buyerId,
    type: "PAYMENT",
    title: "Payment received",
    body: `Order ${order.orderNumber} is paid and waiting for the seller.`,
    link: `/orders`,
  });
}
