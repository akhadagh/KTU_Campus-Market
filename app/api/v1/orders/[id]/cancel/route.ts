import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

const schema = z.object({ reason: z.string().trim().min(5).max(500).optional() });

/**
 * A buyer may cancel while the order is still awaiting payment, or while no
 * seller has started preparing it. Once a seller is working on their part the
 * buyer must raise a dispute or request a refund instead.
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) return fail("VALIDATION_ERROR", "Add a short reason.", 422);

  const order = await prisma.order.findFirst({
    where: { id, buyerId: guard.auth.user.id, deletedAt: null },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      vendorOrders: {
        select: { id: true, status: true, vendor: { select: { userId: true } } },
      },
    },
  });
  if (!order) return fail("NOT_FOUND", "Order not found.", 404);

  const started = order.vendorOrders.some((vendorOrder) =>
    ["ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
      vendorOrder.status,
    ),
  );
  const cancellable = order.status === "PENDING_PAYMENT" || !started;
  if (!cancellable) {
    return fail(
      "CONFLICT",
      "A seller is already preparing this order. Request a refund or raise a problem instead.",
      409,
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: { in: ["PENDING_PAYMENT", "PAID"] } },
      data: { status: "CANCELLED" },
    });
    if (updated.count === 0) return false;

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        toStatus: "CANCELLED",
        actorId: guard.auth.user.id,
        actorType: "BUYER",
        reason: parsed.data.reason ?? "Cancelled by the buyer",
      },
    });
    await tx.inventoryReservation.updateMany({
      where: { orderId: order.id, status: "HELD" },
      data: { status: "RELEASED" },
    });
    await tx.vendorOrder.updateMany({
      where: { orderId: order.id, status: { in: ["PENDING", "ACCEPTED"] } },
      data: { status: "CANCELLED" },
    });
    await tx.payment.updateMany({
      where: { orderId: order.id, status: { in: ["PENDING", "INITIATED"] } },
      data: { status: "CANCELLED" },
    });
    return true;
  });

  if (!result) {
    return fail("CONFLICT", "This order can no longer be cancelled.", 409);
  }

  await Promise.all([
    ...order.vendorOrders.map((vendorOrder) =>
      createNotification({
        userId: vendorOrder.vendor.userId,
        type: "ORDER",
        title: "Order cancelled",
        body: `${order.orderNumber} was cancelled by the buyer.`,
        link: "/sell/orders",
      }),
    ),
    writeAuditLog({
      actorId: guard.auth.user.id,
      action: "order.cancel",
      entityType: "Order",
      entityId: order.id,
      before: { status: order.status },
      after: { status: "CANCELLED", reason: parsed.data.reason ?? null },
    }),
  ]);

  return ok({ cancelled: true, orderId: order.id });
}
