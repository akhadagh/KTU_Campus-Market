import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { hashEmailToken } from "@/lib/email";
import { createNotification } from "@/lib/notifications";
import { prisma } from "@/lib/db";

const schema = z.object({ token: z.string().min(10).max(200) });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Verification link is invalid.", 422);
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashEmailToken(parsed.data.token) },
    include: { user: { select: { id: true, emailVerifiedAt: true, fullName: true } } },
  });

  if (!record || record.usedAt !== null || record.expiresAt.getTime() <= Date.now()) {
    return fail("VALIDATION_ERROR", "This verification link is invalid or has expired.", 400);
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: record.user.emailVerifiedAt ?? new Date() },
    }),
  ]);

  if (!record.user.emailVerifiedAt) {
    await createNotification({
      userId: record.userId,
      type: "SYSTEM",
      title: "Email verified",
      body: "Your email address is now verified.",
      link: "/account",
    });
  }

  return ok({ verified: true });
}
