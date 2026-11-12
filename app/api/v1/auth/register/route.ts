import { z } from "zod";
import { fieldsFromZod, fail, ok } from "@/lib/api-response";
import { sendVerificationEmail } from "@/lib/auth/emails";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { createToken } from "@/lib/email";
import { prisma } from "@/lib/db";
import { clientIp, rateLimitWith } from "@/lib/rate-limit";

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(160, "Name is too long"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Enter your email address")
    .email("Enter a valid email address")
    .max(320, "Email is too long"),
  phone: z
    .string()
    .trim()
    .min(9, "Enter a valid phone number")
    .max(32, "Phone number is too long")
    .optional()
    .or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long"),
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

export async function POST(request: Request) {
  const ip = clientIp(request);
  const registerLimit = await rateLimitWith(`register:${ip}`, 10, {
    windowMs: 60_000,
    failClosed: true,
  });
  if (!registerLimit.allowed) {
    return fail("RATE_LIMITED", "Too many attempts. Try again in a minute.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      "VALIDATION_ERROR",
      "Check the highlighted fields.",
      422,
      fieldsFromZod(parsed.error.issues),
    );
  }

  const { fullName, email, phone, password } = parsed.data;

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, deletedAt: true },
  });
  if (existing && existing.deletedAt === null) {
    return fail("CONFLICT", "An account with this email already exists.", 409, {
      email: "An account with this email already exists.",
    });
  }

  const campus = await prisma.campus.findFirst({
    where: { name: "KTU Main Campus", isActive: true },
    select: { id: true, universityId: true },
  });

  const accountData = {
    fullName,
    email,
    phone: phone || null,
    passwordHash: await hashPassword(password),
    status: "PENDING_VERIFICATION" as const,
    campusId: campus?.id ?? null,
    universityId: campus?.universityId ?? null,
  };

  let userId: string;
  let reactivated = false;
  if (existing) {
    // Reactivating a deleted account must not inherit the old account's trust:
    // sessions are revoked, verification is cleared again and elevated roles
    // (vendor, moderator, admin) are removed until they are granted afresh.
    reactivated = true;
    await prisma.$transaction(async (tx) => {
      await tx.session.updateMany({
        where: { userId: existing.id, revokedAt: null },
        data: { revokedAt: new Date(), revocationReason: "PASSWORD_CHANGED" },
      });
      await tx.userRole.deleteMany({
        where: {
          userId: existing.id,
          role: { name: { in: ["admin", "moderator", "vendor"] } },
        },
      });
      await tx.cartItem.deleteMany({ where: { cart: { userId: existing.id } } });
      await tx.wishlistItem.deleteMany({ where: { wishlist: { userId: existing.id } } });
      await tx.user.update({
        where: { id: existing.id },
        data: {
          ...accountData,
          deletedAt: null,
          emailVerifiedAt: null,
          status: "PENDING_VERIFICATION",
        },
      });
    });
    userId = existing.id;
  } else {
    const created = await prisma.user.create({ data: accountData, select: { id: true } });
    userId = created.id;
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: userSelect,
  });
  await createSession(user.id, {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent"),
  });

  let emailVerification: "sent" | "provider_not_configured" | "provider_error" = "sent";
  try {
    const { token, tokenHash, expiresAt } = createToken();
    await prisma.$transaction([
      prisma.emailVerificationToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      prisma.emailVerificationToken.create({ data: { userId: user.id, tokenHash, expiresAt } }),
    ]);
    const result = await sendVerificationEmail(
      { email: user.email, fullName: user.fullName },
      token,
    );
    if (!result.delivered) {
      emailVerification =
        result.reason === "email_provider_not_configured"
          ? "provider_not_configured"
          : "provider_error";
    }
  } catch {
    emailVerification = "provider_error";
  }

  return ok({ user, emailVerification, reactivated }, { status: 201 });
}
