import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  status: z.enum(["PENDING", "ASSIGNED", "PICKED_UP", "IN_TRANSIT", "DELIVERED", "FAILED"]),
  trackingCode: z.string().trim().max(64).optional(),
  courierType: z.enum(["CAMPUS_RIDER", "THIRD_PARTY", "INTERNAL"]).default("CAMPUS_RIDER"),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Choose a valid delivery status.", 422);
  }

  const vendorOrder = await prisma.vendorOrder.findFirst({
    where: { id, vendorId: guard.auth.vendorId ?? "" },
    select: {
      id: true,
      status: true,
      fulfillmentType: true,
      orderId: true,
      order: { select: { buyerId: true, orderNumber: true } },
    },
  });
  if (!vendorOrder) return fail("NOT_FOUND", "Order not found.", 404);
  if (vendorOrder.fulfillmentType === "PICKUP") {
    return fail("CONFLICT", "Pickup orders do not have a delivery record.", 409);
  }
  if (vendorOrder.status === "CANCELLED" || vendorOrder.status === "DELIVERED") {
    return fail("CONFLICT", "This order can no longer be dispatched.", 409);
  }

  const existing = await prisma.delivery.findFirst({
    where: { vendorOrderId: vendorOrder.id },
    select: { id: true },
  });

  const delivery = existing
    ? await prisma.delivery.update({
        where: { id: existing.id },
        data: {
          status: parsed.data.status,
          ...(parsed.data.trackingCode ? { trackingCode: parsed.data.trackingCode } : {}),
          ...(parsed.data.status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
        },
        select: { id: true, status: true, trackingCode: true, deliveredAt: true },
      })
    : await prisma.delivery.create({
        data: {
          vendorOrderId: vendorOrder.id,
          courierType: parsed.data.courierType,
          status: parsed.data.status,
          trackingCode: parsed.data.trackingCode ?? null,
          deliveredAt: parsed.data.status === "DELIVERED" ? new Date() : null,
        },
        select: { id: true, status: true, trackingCode: true, deliveredAt: true },
      });

  if (parsed.data.status === "DELIVERED") {
    await prisma.$transaction([
      prisma.vendorOrder.update({
        where: { id: vendorOrder.id },
        data: { status: "DELIVERED" },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId: vendorOrder.orderId,
          vendorOrderId: vendorOrder.id,
          fromStatus: vendorOrder.status,
          toStatus: "DELIVERED",
          actorId: guard.auth.user.id,
          actorType: "VENDOR",
          reason: "Delivery confirmed by the seller",
        },
      }),
    ]);
  }

  await Promise.all([
    createNotification({
      userId: vendorOrder.order.buyerId,
      type: "ORDER",
      title: parsed.data.status === "DELIVERED" ? "Your order was delivered" : "Delivery update",
      body:
        parsed.data.status === "DELIVERED"
          ? `Order ${vendorOrder.order.orderNumber} has been marked as delivered.`
          : `Order ${vendorOrder.order.orderNumber} is now ${parsed.data.status.toLowerCase().replaceAll("_", " ")}.`,
      link: "/orders",
    }),
    writeAuditLog({
      actorId: guard.auth.user.id,
      action: "delivery.status",
      entityType: "Delivery",
      entityId: delivery.id,
      after: { status: parsed.data.status, trackingCode: parsed.data.trackingCode ?? null },
    }),
  ]);

  return ok({ delivery });
}
