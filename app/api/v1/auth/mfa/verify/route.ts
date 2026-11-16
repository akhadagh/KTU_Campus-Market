import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { createSession } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { consumeMfaChallenge } from "@/lib/mfa";
import { rateLimitWith } from "@/lib/rate-limit";

const schema = z.object({
  challengeId: z.string().uuid(),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the six digit code"),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Enter the six digit code we emailed you.", 422);
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limit = await rateLimitWith(`mfa-verify:${ip}`, 10, {
    windowMs: 10 * 60_000,
    failClosed: false,
  });
  if (!limit.allowed) {
    return fail("RATE_LIMITED", "Too many attempts. Request a new code.", 429);
  }

  const challenge = await prisma.mfaChallenge.findUnique({
    where: { id: parsed.data.challengeId },
    select: { userId: true },
  });
  if (!challenge) return fail("FORBIDDEN", "This verification request is not valid.", 403);

  const result = await consumeMfaChallenge(
    parsed.data.challengeId,
    challenge.userId,
    parsed.data.code,
  );
  if (!result.ok) {
    return fail("FORBIDDEN", result.reason ?? "That code is not correct.", 403);
  }

  await createSession(challenge.userId, {
    ipAddress: ip,
    userAgent: request.headers.get("user-agent"),
  });

  await writeAuditLog({
    actorId: challenge.userId,
    action: "auth.mfa_completed",
    entityType: "User",
    entityId: challenge.userId,
    after: { challengeId: parsed.data.challengeId },
  });

  return ok({ verified: true });
}
