import { fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

/** Buyer confirms that a delivered order really arrived. */
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const { id } = await params;

  const delivery = await prisma.delivery.findFirst({
    where: { vendorOrderId: id },
    select: {
      id: true,
      status: true,
      vendorOrder: {
        select: {
          id: true,
          status: true,
          orderId: true,
          vendor: { select: { userId: true, storeName: true } },
          order: { select: { buyerId: true, orderNumber: true } },
        },
      },
    },
  });
  if (!delivery) return fail("NOT_FOUND", "Delivery record not found.", 404);
  if (delivery.vendorOrder.order.buyerId !== guard.auth.user.id) {
    return fail("FORBIDDEN", "Only the buyer can confirm this delivery.", 403);
  }
  if (delivery.status !== "DELIVERED") {
    return fail("CONFLICT", "This delivery has not been marked as delivered yet.", 409);
  }

  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "delivery.confirmed_by_buyer",
    entityType: "Delivery",
    entityId: delivery.id,
    after: { orderId: delivery.vendorOrder.orderId },
  });

  await createNotification({
    userId: delivery.vendorOrder.vendor.userId,
    type: "ORDER",
    title: "Delivery confirmed",
    body: `The buyer confirmed that order ${delivery.vendorOrder.order.orderNumber} arrived.`,
    link: "/sell/orders",
  });

  return ok({ confirmed: true });
}
