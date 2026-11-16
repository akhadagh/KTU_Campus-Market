import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  sku: z.string().trim().max(80).optional().or(z.literal("")),
  stock: z.coerce.number().int().min(0).max(1000000).optional(),
  priceDeltaCedis: z.coerce.number().min(-100000).max(100000).optional(),
  isActive: z.boolean().optional(),
});

async function ownedVariant(variantId: string, userId: string) {
  return prisma.productVariant.findFirst({
    where: { id: variantId, product: { vendor: { userId }, deletedAt: null } },
    select: { id: true, productId: true, name: true, stock: true },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> },
) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.PRODUCT_EDIT);
  if (denied) return denied;

  const { variantId } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Check the variant values.", 422);

  const variant = await ownedVariant(variantId, guard.auth.user.id);
  if (!variant) return fail("NOT_FOUND", "Variant not found.", 404);

  const updated = await prisma.productVariant.update({
    where: { id: variant.id },
    data: {
      ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
      ...(parsed.data.sku !== undefined ? { sku: parsed.data.sku || null } : {}),
      ...(parsed.data.stock !== undefined ? { stock: parsed.data.stock } : {}),
      ...(parsed.data.priceDeltaCedis !== undefined
        ? { priceDeltaPesewas: Math.round(parsed.data.priceDeltaCedis * 100) }
        : {}),
      ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
    },
    select: {
      id: true,
      name: true,
      sku: true,
      priceDeltaPesewas: true,
      stock: true,
      isActive: true,
    },
  });

  return ok({ variant: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ variantId: string }> },
) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.PRODUCT_EDIT);
  if (denied) return denied;

  const { variantId } = await params;
  const variant = await ownedVariant(variantId, guard.auth.user.id);
  if (!variant) return fail("NOT_FOUND", "Variant not found.", 404);

  const inCarts = await prisma.cartItem.count({ where: { variantId: variant.id } });
  if (inCarts > 0) {
    return fail(
      "CONFLICT",
      "This variant is in a customer's cart. Deactivate it instead of deleting it.",
      409,
    );
  }

  await prisma.productVariant.delete({ where: { id: variant.id } });
  return ok({ removed: true });
}
