import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { VENDOR_ORDER_TRANSITIONS } from "@/lib/orders";
import type { OrderStatus, VendorOrderStatus } from "@/lib/generated/prisma/enums";

const allowedTargets = new Set([
  "ACCEPTED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.ORDER_MANAGE);
  if (denied) return denied;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const target = (body as { status?: unknown }).status;
  if (typeof target !== "string" || !allowedTargets.has(target)) {
    return fail("VALIDATION_ERROR", "Choose a valid fulfilment status.", 422);
  }

  const vendorOrder = await prisma.vendorOrder.findFirst({
    where: { id, vendorId: guard.auth.vendorId ?? "" },
    select: {
      id: true,
      status: true,
      orderId: true,
      order: { select: { orderNumber: true, buyerId: true } },
    },
  });
  if (!vendorOrder) return fail("NOT_FOUND", "Order not found.", 404);

  const allowed = VENDOR_ORDER_TRANSITIONS[vendorOrder.status] ?? [];
  if (!allowed.includes(target)) {
    return fail(
      "CONFLICT",
      `Cannot change a ${vendorOrder.status.toLowerCase().replaceAll("_", " ")} order to ${target.toLowerCase().replaceAll("_", " ")}.`,
      409,
    );
  }

  const nextStatus = target as VendorOrderStatus;

  await prisma.$transaction([
    prisma.vendorOrder.update({ where: { id }, data: { status: nextStatus } }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: vendorOrder.orderId,
        vendorOrderId: id,
        fromStatus: vendorOrder.status,
        toStatus: target,
        actorId: guard.auth.user.id,
        actorType: "VENDOR",
        reason: "Vendor updated fulfilment",
      },
    }),
  ]);

  const siblingStatuses = await prisma.vendorOrder.findMany({
    where: { orderId: vendorOrder.orderId },
    select: { status: true },
  });
  const statuses = siblingStatuses.map((row) => row.status);
  let orderStatus: OrderStatus | null = null;
  if (statuses.every((status) => status === "DELIVERED")) orderStatus = "FULFILLED";
  else if (statuses.every((status) => status === "CANCELLED")) orderStatus = "CANCELLED";
  else if (statuses.some((status) => status === "DELIVERED")) orderStatus = "PARTIALLY_FULFILLED";

  if (orderStatus) {
    await prisma.$transaction([
      prisma.order.update({ where: { id: vendorOrder.orderId }, data: { status: orderStatus } }),
      prisma.orderStatusHistory.create({
        data: {
          orderId: vendorOrder.orderId,
          toStatus: orderStatus,
          actorType: "SYSTEM",
          reason: "All sellers updated their part",
        },
      }),
    ]);
  }

  await createNotification({
    userId: vendorOrder.order.buyerId,
    type: "ORDER",
    title: `Order ${vendorOrder.order.orderNumber} updated`,
    body: `Status moved to ${target.replaceAll("_", " ").toLowerCase()}.`,
    link: "/orders",
  });

  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "vendor-order.status",
    entityType: "VendorOrder",
    entityId: id,
    before: { status: vendorOrder.status },
    after: { status: target },
  });

  return ok({ id, status: target, orderStatus });
}
