import { z } from "zod";
import { fieldsFromZod, fail, ok } from "@/lib/api-response";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { clientIp, rateLimitWith } from "@/lib/rate-limit";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Enter your email address").max(320),
  password: z.string().min(1, "Enter your password").max(128),
});

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  status: true,
  emailVerifiedAt: true,
  createdAt: true,
} as const;

const BLOCKED_STATUSES = ["SUSPENDED", "BANNED", "DEACTIVATED"];

export async function POST(request: Request) {
  const ip = clientIp(request);
  const loginLimit = await rateLimitWith(`login:${ip}`, 10, {
    windowMs: 60_000,
    failClosed: false,
  });
  if (!loginLimit.allowed) {
    return fail("RATE_LIMITED", "Too many attempts. Try again in a minute.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      "VALIDATION_ERROR",
      "Check the highlighted fields.",
      422,
      fieldsFromZod(parsed.error.issues),
    );
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...userSelect, passwordHash: true, deletedAt: true },
  });

  if (!user || user.deletedAt !== null || !(await verifyPassword(password, user.passwordHash))) {
    return fail("AUTH_REQUIRED", "Incorrect email or password.", 401);
  }
  if (BLOCKED_STATUSES.includes(user.status)) {
    return fail("FORBIDDEN", "This account cannot sign in. Contact support.", 403);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });
  await createSession(user.id, {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent"),
  });

  return ok({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
    },
  });
}
