import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  decision: z.enum([
    "UNDER_REVIEW",
    "RESOLVED_BUYER",
    "RESOLVED_VENDOR",
    "RESOLVED_PARTIAL",
    "CLOSED",
  ]),
  resolution: z.string().trim().min(5).max(2000),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.REPORT_REVIEW);
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
    return fail("VALIDATION_ERROR", "Add a resolution of at least 5 characters.", 422);
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      category: true,
      raisedById: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          buyerId: true,
          vendorOrders: { select: { vendor: { select: { userId: true } } } },
        },
      },
    },
  });
  if (!dispute) return fail("NOT_FOUND", "Dispute not found.", 404);

  await prisma.$transaction([
    prisma.dispute.update({
      where: { id },
      data: {
        status: parsed.data.decision,
        resolution: parsed.data.resolution,
        assignedToId: guard.auth.user.id,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: guard.auth.user.id,
        action: "dispute.resolve",
        entityType: "Dispute",
        entityId: id,
        beforeJson: { status: dispute.status },
        afterJson: { status: parsed.data.decision, resolution: parsed.data.resolution },
      },
    }),
  ]);

  const recipients = new Set<string>([dispute.raisedById]);
  for (const vendorOrder of dispute.order.vendorOrders) recipients.add(vendorOrder.vendor.userId);
  await Promise.all(
    [...recipients].map((userId) =>
      createNotification({
        userId,
        type: "ALERT",
        title: "Dispute update",
        body: `Order ${dispute.order.orderNumber}: ${parsed.data.resolution}`,
        link: "/messages",
      }),
    ),
  );

  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "dispute.resolve",
    entityType: "Dispute",
    entityId: id,
    before: { status: dispute.status },
    after: { status: parsed.data.decision },
  });

  return ok({ id, status: parsed.data.decision });
}
