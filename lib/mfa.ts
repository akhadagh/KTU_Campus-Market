import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/db";

const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

export function hashMfaCode(challengeId: string, code: string): string {
  return createHash("sha256").update(`${challengeId}:${code}`).digest("hex");
}

export function generateMfaCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export async function createMfaChallenge(userId: string): Promise<{
  id: string;
  code: string;
  expiresAt: Date;
}> {
  const id = crypto.randomUUID();
  const code = generateMfaCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);
  await prisma.mfaChallenge.create({
    data: { id, userId, codeHash: hashMfaCode(id, code), expiresAt },
  });
  return { id, code, expiresAt };
}

export async function consumeMfaChallenge(
  challengeId: string,
  userId: string,
  code: string,
): Promise<{ ok: boolean; reason?: string }> {
  const challenge = await prisma.mfaChallenge.findUnique({
    where: { id: challengeId },
    select: {
      id: true,
      userId: true,
      codeHash: true,
      expiresAt: true,
      attempts: true,
      consumedAt: true,
    },
  });
  if (!challenge || challenge.userId !== userId) {
    return { ok: false, reason: "This verification request is not valid." };
  }
  if (challenge.consumedAt !== null) {
    return { ok: false, reason: "This code has already been used. Request a new one." };
  }
  if (challenge.expiresAt.getTime() < Date.now()) {
    return { ok: false, reason: "This code has expired. Request a new one." };
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "Too many incorrect attempts. Request a new code." };
  }
  if (challenge.codeHash !== hashMfaCode(challenge.id, code)) {
    await prisma.mfaChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "That code is not correct." };
  }
  await prisma.mfaChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });
  return { ok: true };
}

export function isStaffUser(roles: { role: { name: string } }[]): boolean {
  return roles.some((entry) => entry.role.name === "admin" || entry.role.name === "moderator");
}

/**
 * Staff multi-factor authentication can be turned off in platform settings
 * (used when no mail provider is available). It is on by default.
 */
export async function staffMfaRequired(): Promise<boolean> {
  const setting = await prisma.platformSetting.findUnique({
    where: { key: "staff.mfaRequired" },
    select: { valueJson: true },
  });
  if (!setting) return true;
  return setting.valueJson !== false;
}
