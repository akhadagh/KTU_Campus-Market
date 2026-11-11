import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  decision: z.enum(["IN_REVIEW", "RESOLVED", "DISMISSED"]),
  note: z.string().trim().max(1000).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  if (!parsed.success) return fail("VALIDATION_ERROR", "Choose a valid decision.", 422);

  const report = await prisma.report.findUnique({
    where: { id },
    select: { id: true, status: true, reporterId: true, targetType: true, targetId: true },
  });
  if (!report) return fail("NOT_FOUND", "Report not found.", 404);

  const nextStatus =
    parsed.data.decision === "IN_REVIEW"
      ? "IN_REVIEW"
      : parsed.data.decision === "RESOLVED"
        ? "RESOLVED"
        : "DISMISSED";

  await prisma.report.update({
    where: { id },
    data: {
      status: nextStatus,
      resolution: parsed.data.note ?? null,
      assignedToId:
        nextStatus === "IN_REVIEW"
          ? guard.auth.user.id
          : report.status === "IN_REVIEW"
            ? guard.auth.user.id
            : undefined,
    },
  });

  await Promise.all([
    createNotification({
      userId: report.reporterId,
      type: "SYSTEM",
      title: "Report update",
      body:
        nextStatus === "RESOLVED"
          ? "Thanks — our team reviewed your report."
          : nextStatus === "DISMISSED"
            ? "Our team reviewed your report and did not take action."
            : "Our team is reviewing your report.",
      link: "/account",
    }),
    writeAuditLog({
      actorId: guard.auth.user.id,
      action: `report.${parsed.data.decision.toLowerCase()}`,
      entityType: "Report",
      entityId: report.id,
      before: { status: report.status },
      after: { status: nextStatus },
    }),
  ]);

  return ok({ id: report.id, status: nextStatus });
}
