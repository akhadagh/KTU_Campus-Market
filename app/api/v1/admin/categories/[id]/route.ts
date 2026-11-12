import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  type: z.enum(["PRODUCT", "SERVICE"]).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
  iconUrl: z.string().trim().max(600).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.SETTINGS_MANAGE);
  if (denied) return denied;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Check the values you sent.", 422);
  }

  const before = await prisma.category.findUnique({
    where: { id },
    select: { id: true, name: true, type: true, sortOrder: true, isActive: true, iconUrl: true },
  });
  if (!before) return fail("NOT_FOUND", "Category not found.", 404);

  const category = await prisma.category.update({
    where: { id },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      sortOrder: true,
      isActive: true,
      iconUrl: true,
    },
  });

  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "category.update",
    entityType: "Category",
    entityId: id,
    before,
    after: parsed.data,
  });

  return ok({ category });
}
