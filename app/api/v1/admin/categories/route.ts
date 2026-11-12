import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";

const createSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(["PRODUCT", "SERVICE"]),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  iconUrl: z.string().trim().max(600).optional().or(z.literal("")),
});

export async function GET() {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.SETTINGS_MANAGE);
  if (denied) return denied;

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      iconUrl: true,
      sortOrder: true,
      isActive: true,
      parentId: true,
      _count: { select: { products: true, children: true } },
    },
  });

  return ok({ categories });
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
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", "Add a name of at least 2 characters.", 422);
  }

  const base = slugify(parsed.data.name) || "category";
  let slug = base;
  let suffix = 1;
  while (await prisma.category.findUnique({ where: { slug }, select: { id: true } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  const category = await prisma.category.create({
    data: {
      name: parsed.data.name,
      slug,
      type: parsed.data.type,
      sortOrder: parsed.data.sortOrder,
      iconUrl: parsed.data.iconUrl || `/categories/${slug}.jpg`,
    },
    select: { id: true, name: true, slug: true, iconUrl: true },
  });

  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "category.create",
    entityType: "Category",
    entityId: category.id,
    after: { name: category.name, slug: category.slug },
  });

  return ok({ category }, { status: 201 });
}
