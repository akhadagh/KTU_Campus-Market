import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "cm_session";
const SESSION_TTL_DAYS = 30;

const userSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  status: true,
  emailVerifiedAt: true,
  campusId: true,
  universityId: true,
  createdAt: true,
} as const;

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  status: string;
  emailVerifiedAt: Date | null;
  campusId: string | null;
  universityId: string | null;
  createdAt: Date;
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(
  userId: string,
  meta?: { ipAddress?: string | null; userAgent?: string | null },
): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ipAddress: meta?.ipAddress?.slice(0, 64) ?? null,
      userAgent: meta?.userAgent?.slice(0, 512) ?? null,
    },
  });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

const BLOCKED_STATUSES = ["SUSPENDED", "BANNED", "DEACTIVATED"];

export async function getSession(): Promise<{
  sessionId: string;
  expiresAt: Date;
  user: SessionUser;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: userSelect } },
  });
  if (!session || session.revokedAt !== null || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }
  if (BLOCKED_STATUSES.includes(session.user.status)) {
    return null;
  }
  return { sessionId: session.id, expiresAt: session.expiresAt, user: session.user };
}

export async function requireUser() {
  const auth = await getSession();
  if (!auth) redirect("/login");
  return auth;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.updateMany({
      where: { tokenHash: hashToken(token), revokedAt: null },
      data: { revokedAt: new Date(), revocationReason: "USER_LOGOUT" },
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}
