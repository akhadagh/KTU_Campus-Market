import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";

const schema = z.object({
  current: z.string().min(1, "Enter your current password"),
  next: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export async function POST(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Check your passwords.",
      422,
    );
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: guard.auth.user.id },
    select: { id: true, passwordHash: true },
  });

  const valid = await verifyPassword(parsed.data.current, user.passwordHash);
  if (!valid) {
    return fail("FORBIDDEN", "Your current password is not correct.", 403);
  }

  const passwordHash = await hashPassword(parsed.data.next);
  const now = new Date();

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
    prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: now, revocationReason: "PASSWORD_CHANGED" },
    }),
  ]);

  await writeAuditLog({
    actorId: user.id,
    action: "user.password_changed",
    entityType: "User",
    entityId: user.id,
  });

  return ok({ changed: true, signedOutEverywhere: true });
}
