import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED", "DEACTIVATED"]),
  reason: z.string().trim().max(500).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
  if (!parsed.success) return fail("VALIDATION_ERROR", "Choose a valid account status.", 422);

  if (id === guard.auth.user.id) {
    return fail("CONFLICT", "You cannot change your own account status here.", 409);
  }

  const target = await prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, email: true, status: true, fullName: true },
  });
  if (!target) return fail("NOT_FOUND", "User not found.", 404);

  const before = { status: target.status };
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data: { status: parsed.data.status } });

    if (parsed.data.status !== "ACTIVE") {
      // Suspended accounts must lose access immediately.
      await tx.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date(), revocationReason: "ADMIN_REVOKED" },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: guard.auth.user.id,
        action: "user.status_changed",
        entityType: "User",
        entityId: id,
        beforeJson: before,
        afterJson: { status: parsed.data.status, reason: parsed.data.reason ?? null },
      },
    });
  });

  await createNotification({
    userId: id,
    type: "SYSTEM",
    title:
      parsed.data.status === "ACTIVE"
        ? "Your JUMART account is active again"
        : "Your JUMART account has been suspended",
    body: parsed.data.reason,
    link: "/account",
  });

  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "user.status_changed",
    entityType: "User",
    entityId: id,
    before,
    after: { status: parsed.data.status, reason: parsed.data.reason ?? null },
  });

  return ok({ id, status: parsed.data.status });
}
