import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";
import { rateLimitWith } from "@/lib/rate-limit";

const disputeSchema = z.object({
  category: z.enum([
    "NOT_RECEIVED",
    "NOT_AS_DESCRIBED",
    "PAYMENT_ISSUE",
    "QUALITY_ISSUE",
    "LATE_DELIVERY",
    "OTHER",
  ]),
  description: z.string().trim().min(20).max(4000),
  evidenceLinks: z.array(z.string().trim().url().max(600)).max(5).optional().default([]),
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
  const parsed = disputeSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Describe the problem in at least 20 characters.", 422);
  }

  const disputeLimit = await rateLimitWith(`dispute:${auth.user.id}`, 10, {
    windowMs: 60 * 60_000,
    failClosed: false,
  });
  if (!disputeLimit.allowed) {
    return fail("RATE_LIMITED", "Too many disputes submitted. Try again later.", 429);
  }

  const order = await prisma.order.findFirst({
    where: { id, buyerId: auth.user.id, deletedAt: null },
    select: { id: true, orderNumber: true, status: true },
  });
  if (!order) return fail("NOT_FOUND", "Order not found.", 404);
  if (!["PAID", "PARTIALLY_FULFILLED", "FULFILLED"].includes(order.status)) {
    return fail("CONFLICT", "Only paid orders can be disputed.", 409);
  }

  const open = await prisma.dispute.findFirst({
    where: { orderId: order.id, status: { in: ["OPEN", "UNDER_REVIEW"] } },
    select: { id: true },
  });
  if (open) {
    return fail("CONFLICT", "A dispute for this order is already open.", 409);
  }

  const dispute = await prisma.dispute.create({
    data: {
      orderId: order.id,
      raisedById: auth.user.id,
      category: parsed.data.category,
      description: parsed.data.description,
      status: "OPEN",
    },
    select: { id: true, status: true },
  });

  for (const link of parsed.data.evidenceLinks) {
    await prisma.disputeEvidence.create({
      data: { disputeId: dispute.id, uploaderId: auth.user.id, fileUrl: link },
    });
  }

  await writeAuditLog({
    actorId: auth.user.id,
    action: "dispute.create",
    entityType: "Dispute",
    entityId: dispute.id,
    after: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      category: parsed.data.category,
      evidenceCount: parsed.data.evidenceLinks.length,
    },
  });

  const admins = await prisma.user.findMany({
    where: {
      deletedAt: null,
      roles: { some: { role: { name: { in: ["admin", "moderator"] } } } },
    },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: "ALERT",
        title: "New dispute",
        body: `Order ${order.orderNumber} was disputed: ${parsed.data.category.replaceAll("_", " ")}`,
        link: "/admin/disputes",
      }),
    ),
  );

  return ok({ dispute }, { status: 201 });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: {
      id,
      OR: [
        { buyerId: guard.auth.user.id },
        { vendorOrders: { some: { vendorId: guard.auth.vendorId ?? "" } } },
      ],
    },
    select: { id: true },
  });
  if (!order) return fail("NOT_FOUND", "Order not found.", 404);

  const disputes = await prisma.dispute.findMany({
    where: { orderId: id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      category: true,
      description: true,
      status: true,
      resolution: true,
      createdAt: true,
      raisedBy: { select: { fullName: true } },
      evidence: { select: { id: true, fileUrl: true } },
    },
  });

  return ok({ disputes });
}
