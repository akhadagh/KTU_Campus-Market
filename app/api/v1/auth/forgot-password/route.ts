import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { sendPasswordResetEmail } from "@/lib/auth/emails";
import { createToken } from "@/lib/email";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().toLowerCase().email().max(320) });

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!rateLimit(`forgot-password:${ip}`, 5, 10 * 60_000)) {
    return fail("RATE_LIMITED", "Too many requests. Try again later.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Enter a valid email address.", 422);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true, fullName: true, deletedAt: true },
  });

  if (user && user.deletedAt === null) {
    const { token, tokenHash } = createToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await prisma.$transaction([
      prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      }),
    ]);
    await sendPasswordResetEmail({ email: user.email, fullName: user.fullName }, token);
  }

  const delivery = process.env["RESEND_API_KEY"] ? "email" : "provider_not_configured";
  return ok({ sent: true, delivery });
}
