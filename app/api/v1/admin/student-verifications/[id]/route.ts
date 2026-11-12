import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  notes: z.string().trim().max(1000).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.USER_MANAGE);
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

  const verification = await prisma.studentVerification.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      userId: true,
      user: { select: { university: { select: { name: true } } } },
    },
  });
  if (!verification) return fail("NOT_FOUND", "Verification request not found.", 404);
  if (verification.status !== "PENDING") {
    return fail("CONFLICT", "This request has already been reviewed.", 409);
  }

  await prisma.$transaction([
    prisma.studentVerification.update({
      where: { id },
      data: {
        status: parsed.data.decision,
        notes: parsed.data.notes ?? null,
        reviewedBy: guard.auth.user.id,
        reviewedAt: new Date(),
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: guard.auth.user.id,
        action: "student_verification.review",
        entityType: "StudentVerification",
        entityId: id,
        beforeJson: { status: verification.status },
        afterJson: { status: parsed.data.decision, notes: parsed.data.notes ?? null },
      },
    }),
  ]);

  await createNotification({
    userId: verification.userId,
    type: "SYSTEM",
    title:
      parsed.data.decision === "APPROVED"
        ? "Student verification approved"
        : "Student verification was not approved",
    body:
      parsed.data.decision === "APPROVED"
        ? `You are verified as a ${verification.user?.university?.name ?? "campus"} student.`
        : (parsed.data.notes ?? "Please contact support for details."),
    link: "/account/verification",
  });

  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "student_verification.review",
    entityType: "StudentVerification",
    entityId: id,
    before: { status: verification.status },
    after: { status: parsed.data.decision },
  });

  return ok({ id, status: parsed.data.decision });
}
