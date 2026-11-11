import { fieldsFromZod, fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { cedisToPesewas } from "@/lib/money";
import { productUpdateSchema } from "@/lib/validation";

const vendorTransitions = new Set(["DRAFT", "PENDING_REVIEW", "ARCHIVED"]);

async function ownProduct(productId: string, userId: string) {
  return prisma.product.findFirst({
    where: { id: productId, vendor: { userId }, deletedAt: null },
    select: {
      id: true,
      vendorId: true,
      status: true,
      name: true,
      pricePesewas: true,
      originalPricePesewas: true,
    },
  });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const { auth } = guard;
  const denied = requireApiPermission(auth, PERMISSION.PRODUCT_EDIT);
  if (denied) return denied;

  const { id } = await params;
  const product = await ownProduct(id, auth.user.id);
  if (!product) return fail("NOT_FOUND", "Product not found.", 404);
  if (auth.vendorStatus !== "ACTIVE") {
    return fail("FORBIDDEN", "Your vendor store must be active to manage products.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = productUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      "VALIDATION_ERROR",
      "Check the highlighted fields.",
      422,
      fieldsFromZod(parsed.error.issues),
    );
  }
  const values = parsed.data;
  if (Object.keys(values).length === 0) {
    return fail("VALIDATION_ERROR", "Nothing to update.", 422);
  }
  if (values.status && !vendorTransitions.has(values.status)) {
    return fail("FORBIDDEN", "Vendors cannot publish products directly.", 403);
  }

  if (values.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: values.categoryId, isActive: true },
      select: { id: true },
    });
    if (!category) {
      return fail("VALIDATION_ERROR", "Choose a valid category.", 422, {
        categoryId: "Choose a valid category",
      });
    }
  }

  const pricePesewas =
    values.priceCedis !== undefined ? cedisToPesewas(values.priceCedis) : undefined;
  const originalPricePesewas =
    values.originalPriceCedis !== undefined ? cedisToPesewas(values.originalPriceCedis) : undefined;
  const effectivePrice = pricePesewas ?? product.pricePesewas;
  const effectiveOriginal =
    originalPricePesewas === undefined ? product.originalPricePesewas : originalPricePesewas;
  if (
    effectiveOriginal !== null &&
    effectiveOriginal !== undefined &&
    effectiveOriginal <= effectivePrice
  ) {
    return fail("VALIDATION_ERROR", "Original price must be higher than the selling price.", 422, {
      originalPriceCedis: "Original price must be higher than the selling price",
    });
  }

  const contentChanged = [
    values.name,
    values.categoryId,
    values.description,
    values.priceCedis,
    values.originalPriceCedis,
    values.condition,
    values.quantity,
    values.deliveryOptions,
    values.pickupAvailable,
    values.tags,
    values.imageUrls,
  ].some((value) => value !== undefined);

  let nextStatus = values.status;
  if (!nextStatus && contentChanged && product.status === "ACTIVE") {
    nextStatus = "PENDING_REVIEW";
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (values.imageUrls !== undefined) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (values.imageUrls.length > 0) {
        await tx.productImage.createMany({
          data: values.imageUrls.map((url, index) => ({
            productId: id,
            url,
            altText: `${values.name ?? product.name} photo ${index + 1}`,
            sortOrder: index,
          })),
        });
      }
    }
    return tx.product.update({
      where: { id },
      data: {
        ...(values.name !== undefined ? { name: values.name } : {}),
        ...(values.categoryId !== undefined ? { categoryId: values.categoryId } : {}),
        ...(values.description !== undefined ? { description: values.description } : {}),
        ...(pricePesewas !== undefined ? { pricePesewas } : {}),
        ...(originalPricePesewas !== undefined ? { originalPricePesewas } : {}),
        ...(values.condition !== undefined ? { condition: values.condition } : {}),
        ...(values.quantity !== undefined ? { quantity: values.quantity } : {}),
        ...(values.deliveryOptions !== undefined
          ? { deliveryOptions: values.deliveryOptions }
          : {}),
        ...(values.pickupAvailable !== undefined
          ? { pickupAvailable: values.pickupAvailable }
          : {}),
        ...(values.tags !== undefined ? { tags: values.tags } : {}),
        ...(nextStatus !== undefined ? { status: nextStatus } : {}),
        ...(nextStatus === "PENDING_REVIEW" ? { publishedAt: null } : {}),
      },
      select: { id: true, name: true, slug: true, status: true, updatedAt: true },
    });
  });

  await writeAuditLog({
    actorId: auth.user.id,
    action: "product.update",
    entityType: "Product",
    entityId: id,
    before: { status: product.status, pricePesewas: product.pricePesewas },
    after: { status: updated.status, fields: Object.keys(values) },
  });

  return ok({ product: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.PRODUCT_EDIT);
  if (denied) return denied;

  const { id } = await params;
  const product = await ownProduct(id, guard.auth.user.id);
  if (!product) return fail("NOT_FOUND", "Product not found.", 404);

  await prisma.product.update({ where: { id }, data: { status: "ARCHIVED" } });
  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "product.archive",
    entityType: "Product",
    entityId: id,
    before: { status: product.status },
    after: { status: "ARCHIVED" },
  });
  return ok({ archived: true });
}
