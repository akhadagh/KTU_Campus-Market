import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { assessRefundEligibility } from "@/lib/refunds";

const schema = z.object({
  amountCedis: z.coerce.number().positive().max(1_000_000),
  reason: z.string().trim().min(5).max(500),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const { auth } = guard;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Give a reason and the amount you want refunded.", 422);
  }

  const order = await prisma.order.findFirst({
    where: { id, buyerId: auth.user.id, deletedAt: null },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalPesewas: true,
      payments: {
        where: { status: "SUCCEEDED" },
        select: { id: true, amountPesewas: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!order) return fail("NOT_FOUND", "Order not found.", 404);
  if (order.payments.length === 0) {
    return fail("CONFLICT", "This order has no completed payment to refund.", 409);
  }

  const eligibility = await assessRefundEligibility(order.id);
  if (!eligibility.eligible) {
    return fail("CONFLICT", eligibility.reason ?? "This order is not eligible for a refund.", 409);
  }

  const amountPesewas = Math.round(parsed.data.amountCedis * 100);
  if (amountPesewas > eligibility.maxRefundablePesewas) {
    return fail(
      "VALIDATION_ERROR",
      `You can request up to GH₵${(eligibility.maxRefundablePesewas / 100).toFixed(2)} for this order.`,
      422,
    );
  }

  const refund = await prisma.refund.create({
    data: {
      paymentId: order.payments[0].id,
      amountPesewas,
      reason: parsed.data.reason,
      status: "REQUESTED",
      requestedById: auth.user.id,
    },
    select: { id: true, amountPesewas: true, status: true },
  });

  await writeAuditLog({
    actorId: auth.user.id,
    action: "refund.requested",
    entityType: "Refund",
    entityId: refund.id,
    after: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountPesewas,
      reason: parsed.data.reason,
    },
  });

  const admins = await prisma.user.findMany({
    where: {
      deletedAt: null,
      roles: { some: { role: { name: { in: ["admin"] } } } },
    },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: "SYSTEM",
        title: "Refund request",
        body: `${auth.user.fullName} requested a refund on order ${order.orderNumber}.`,
        link: "/admin/refunds",
      }),
    ),
  );

  return ok({ refund }, { status: 201 });
}
