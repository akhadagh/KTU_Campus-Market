import { randomInt } from "node:crypto";
import type { DeliveryOption } from "@/lib/generated/prisma/enums";
import { prisma } from "@/lib/db";

export const DELIVERY_FEES_PESEWAS: Record<DeliveryOption, number> = {
  PICKUP: 0,
  CAMPUS_DELIVERY: 500,
  COURIER: 1500,
  DIGITAL: 0,
};

export const RESERVATION_MINUTES = 30;
export const PAYMENT_WINDOW_MINUTES = 30;

/**
 * Cancels orders whose payment window has closed, releases the inventory they
 * were holding and fails their pending payments. Safe to call repeatedly.
 */
export async function expireStaleOrders(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - PAYMENT_WINDOW_MINUTES * 60 * 1000);
  const stale = await prisma.order.findMany({
    where: { status: "PENDING_PAYMENT", placedAt: { lt: cutoff } },
    select: { id: true, orderNumber: true },
    take: 50,
  });
  if (stale.length === 0) return 0;

  let expired = 0;
  for (const order of stale) {
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.updateMany({
        where: { id: order.id, status: "PENDING_PAYMENT" },
        data: { status: "CANCELLED" },
      });
      if (updated.count === 0) return false;

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          toStatus: "CANCELLED",
          actorType: "SYSTEM",
          reason: "Payment window expired",
        },
      });
      await tx.inventoryReservation.updateMany({
        where: { orderId: order.id, status: "HELD" },
        data: { status: "RELEASED" },
      });
      await tx.payment.updateMany({
        where: { orderId: order.id, status: { in: ["PENDING", "INITIATED"] } },
        data: { status: "CANCELLED" },
      });
      return true;
    });
    if (result) expired += 1;
  }
  return expired;
}

export function generateOrderNumber(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate(),
  ).padStart(2, "0")}`;
  const suffix = String(randomInt(0, 100000)).padStart(5, "0");
  return `CM-${stamp}-${suffix}`;
}

export const VENDOR_ORDER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_PICKUP: ["OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
  REFUNDED: [],
};
