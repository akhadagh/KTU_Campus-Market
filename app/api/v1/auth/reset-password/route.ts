import { cookies } from "next/headers";
import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { hashPassword } from "@/lib/auth/password";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { hashEmailToken } from "@/lib/email";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  token: z.string().min(10).max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`reset-password:${ip}`, 10, 10 * 60_000)) {
    return fail("RATE_LIMITED", "Too many attempts. Try again later.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Check the highlighted fields.", 422, {
      password: parsed.error.issues[0]?.message,
    });
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashEmailToken(parsed.data.token) },
    select: { id: true, userId: true, usedAt: true, expiresAt: true },
  });
  if (!record || record.usedAt !== null || record.expiresAt.getTime() <= Date.now()) {
    return fail("VALIDATION_ERROR", "This reset link is invalid or has expired.", 400);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const now = new Date();
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: now } }),
    prisma.session.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: now, revocationReason: "PASSWORD_CHANGED" },
    }),
  ]);

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);

  return ok({ reset: true });
}
