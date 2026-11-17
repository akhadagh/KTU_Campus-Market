import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";

const schema = z.object({
  title: z.string().trim().min(3).max(160),
  body: z.string().trim().min(10).max(2000),
  audience: z.enum(["ALL", "BUYERS", "VENDORS", "CAMPUS"]).default("ALL"),
});

export async function GET() {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.SETTINGS_MANAGE);
  if (denied) return denied;

  const announcements = await prisma.announcement.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      title: true,
      body: true,
      audience: true,
      status: true,
      publishedAt: true,
      createdAt: true,
      createdBy: { select: { fullName: true } },
    },
  });
  return ok({ announcements });
}

export async function POST(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.SETTINGS_MANAGE);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Give the announcement a title and a short message.", 422);
  }
  const values = parsed.data;

  const announcement = await prisma.announcement.create({
    data: {
      title: values.title,
      body: values.body,
      audience: values.audience,
      status: "PUBLISHED",
      publishedAt: new Date(),
      createdById: guard.auth.user.id,
    },
    select: { id: true, title: true, status: true },
  });

  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "announcement.publish",
    entityType: "Announcement",
    entityId: announcement.id,
    after: { title: announcement.title, audience: values.audience },
  });

  return ok({ announcement }, { status: 201 });
}
