import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { approveRefund } from "@/lib/refunds";

const schema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(1000).optional(),
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
  if (!parsed.success) return fail("VALIDATION_ERROR", "Choose a valid decision.", 422);

  const refund = await prisma.refund.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!refund) return fail("NOT_FOUND", "Refund request not found.", 404);

  if (parsed.data.decision === "REJECT") {
    const updated = await prisma.refund.update({
      where: { id },
      data: {
        status: "REJECTED",
        processedById: guard.auth.user.id,
        processedAt: new Date(),
        reason: parsed.data.note ?? refund.status,
      },
      select: { id: true, status: true },
    });
    await prisma.auditLog.create({
      data: {
        actorId: guard.auth.user.id,
        action: "refund.rejected",
        entityType: "Refund",
        entityId: id,
        beforeJson: { status: refund.status },
        afterJson: { status: "REJECTED", note: parsed.data.note ?? null },
      },
    });
    return ok({ refund: updated });
  }

  const result = await approveRefund({
    refundId: id,
    actorId: guard.auth.user.id,
    note: parsed.data.note,
  });
  if (!result.ok) return fail("CONFLICT", result.message, 409);
  return ok({ refund: { id, status: "PROCESSING" } });
}
