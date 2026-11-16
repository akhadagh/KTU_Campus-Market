import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

const schema = z.object({
  reason: z.string().trim().min(10, "Tell us why you are closing your account").max(1000),
});

/**
 * Account closure request. The account is deactivated immediately (sessions are
 * revoked) while the request is reviewed, so nothing keeps trading on it.
 */
export async function POST(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const { auth } = guard;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Tell us why.", 422);
  }

  const openOrders = await prisma.order.count({
    where: {
      buyerId: auth.user.id,
      status: { in: ["PENDING_PAYMENT", "PAID", "PARTIALLY_FULFILLED"] },
    },
  });
  if (openOrders > 0) {
    return fail("CONFLICT", "Finish or cancel your open orders before closing your account.", 409);
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: auth.user.id },
      data: { closureRequestedAt: now, status: "DEACTIVATED" },
    }),
    prisma.session.updateMany({
      where: { userId: auth.user.id, revokedAt: null },
      data: { revokedAt: now, revocationReason: "USER_LOGOUT" },
    }),
  ]);

  await writeAuditLog({
    actorId: auth.user.id,
    action: "user.closure_requested",
    entityType: "User",
    entityId: auth.user.id,
    after: { reason: parsed.data.reason },
  });

  const admins = await prisma.user.findMany({
    where: { deletedAt: null, roles: { some: { role: { name: "admin" } } } },
    select: { id: true },
  });
  await Promise.all(
    admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: "SYSTEM",
        title: "Account closure requested",
        body: `${auth.user.fullName} asked to close their account.`,
        link: "/admin/users",
      }),
    ),
  );

  return ok({ requested: true, deactivatedAt: now });
}
