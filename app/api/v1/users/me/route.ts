import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";

const schema = z.object({
  fullName: z.string().trim().min(2).max(160),
  phone: z.string().trim().min(9).max(32).optional().or(z.literal("")),
});

export async function GET() {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;

  const [profile, preference] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: guard.auth.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        emailVerifiedAt: true,
        campus: { select: { name: true } },
        university: { select: { name: true } },
      },
    }),
    prisma.userPreference.findUnique({
      where: { userId: guard.auth.user.id },
      select: { notificationPrefsJson: true, personalizationEnabled: true },
    }),
  ]);

  return ok({ profile, preference });
}

export async function PATCH(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Enter your name and a valid phone number.", 422);
  }

  const user = await prisma.user.update({
    where: { id: guard.auth.user.id },
    data: {
      fullName: parsed.data.fullName,
      phone: parsed.data.phone || null,
    },
    select: { id: true, fullName: true, phone: true },
  });

  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "user.profile_update",
    entityType: "User",
    entityId: user.id,
    after: { fullName: user.fullName, phone: user.phone },
  });

  return ok({ user });
}
