import { randomInt } from "node:crypto";
import type { DeliveryOption } from "@/lib/generated/prisma/enums";

export const DELIVERY_FEES_PESEWAS: Record<DeliveryOption, number> = {
  PICKUP: 0,
  CAMPUS_DELIVERY: 500,
  COURIER: 1500,
  DIGITAL: 0,
};

export const RESERVATION_MINUTES = 30;

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
