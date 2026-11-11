import { fail, ok } from "@/lib/api-response";
import { sendVerificationEmail } from "@/lib/auth/emails";
import { getSession } from "@/lib/auth/session";
import { createToken } from "@/lib/email";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

export async function POST() {
  const session = await getSession();
  if (!session) return fail("AUTH_REQUIRED", "Log in to request a new verification email.", 401);
  if (session.user.emailVerifiedAt) {
    return ok({ sent: false, alreadyVerified: true });
  }
  if (!rateLimit(`resend-verification:${session.user.id}`, 3, 10 * 60_000)) {
    return fail("RATE_LIMITED", "Too many requests. Try again later.", 429);
  }

  const { token, tokenHash, expiresAt } = createToken();
  await prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({
      where: { userId: session.user.id, usedAt: null },
    }),
    prisma.emailVerificationToken.create({
      data: { userId: session.user.id, tokenHash, expiresAt },
    }),
  ]);

  const result = await sendVerificationEmail(
    { email: session.user.email, fullName: session.user.fullName },
    token,
  );

  return ok({
    sent: true,
    delivery: result.delivered ? "email" : (result.reason ?? "unknown"),
  });
}
