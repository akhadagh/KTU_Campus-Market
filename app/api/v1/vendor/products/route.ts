import { fieldsFromZod, fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { cedisToPesewas } from "@/lib/money";
import { productSchema } from "@/lib/validation";
import { availableProductSlug } from "@/lib/vendors";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const { auth } = guard;
  const denied = requireApiPermission(auth, PERMISSION.PRODUCT_CREATE);
  if (denied) return denied;
  if (!auth.vendorId || auth.vendorStatus !== "ACTIVE") {
    return fail("FORBIDDEN", "An active vendor store is required to create products.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      "VALIDATION_ERROR",
      "Check the highlighted fields.",
      422,
      fieldsFromZod(parsed.error.issues),
    );
  }
  const values = parsed.data;

  const category = await prisma.category.findFirst({
    where: { id: values.categoryId, isActive: true },
    select: { id: true },
  });
  if (!category) {
    return fail("VALIDATION_ERROR", "Choose a valid category.", 422, {
      categoryId: "Choose a valid category",
    });
  }

  const pricePesewas = cedisToPesewas(values.priceCedis);
  const originalPricePesewas = values.originalPriceCedis
    ? cedisToPesewas(values.originalPriceCedis)
    : null;
  if (originalPricePesewas !== null && originalPricePesewas <= pricePesewas) {
    return fail("VALIDATION_ERROR", "Original price must be higher than the selling price.", 422, {
      originalPriceCedis: "Original price must be higher than the selling price",
    });
  }

  const slug = await availableProductSlug(values.name);
  const product = await prisma.product.create({
    data: {
      vendorId: auth.vendorId,
      categoryId: values.categoryId,
      name: values.name,
      slug,
      description: values.description,
      pricePesewas,
      originalPricePesewas,
      condition: values.condition,
      quantity: values.quantity,
      status: values.status,
      campusId: auth.user.campusId,
      deliveryOptions: values.deliveryOptions,
      pickupAvailable: values.pickupAvailable,
      tags: values.tags,
      images: {
        create: values.imageUrls.map((url, index) => ({
          url,
          altText: `${values.name} photo ${index + 1}`,
          sortOrder: index,
        })),
      },
    },
    select: { id: true, name: true, slug: true, status: true, pricePesewas: true },
  });

  await writeAuditLog({
    actorId: auth.user.id,
    action: "product.create",
    entityType: "Product",
    entityId: product.id,
    after: { name: product.name, status: product.status, pricePesewas: product.pricePesewas },
    ipAddress: request.headers.get("x-forwarded-for"),
    userAgent: request.headers.get("user-agent"),
  });

  return ok({ product }, { status: 201 });
}
