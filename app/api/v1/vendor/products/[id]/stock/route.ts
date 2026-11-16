import { z } from "zod";
import { fail, ok } from "@/lib/api-response";
import { requireApiAuth, requireApiPermission } from "@/lib/auth/api-guards";
import { PERMISSION } from "@/lib/auth/rbac";
import { writeAuditLog } from "@/lib/audit";
import { prisma } from "@/lib/db";

const schema = z.object({
  quantity: z.coerce.number().int().min(0).max(1_000_000),
  variantId: z.string().uuid().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const denied = requireApiPermission(guard.auth, PERMISSION.PRODUCT_EDIT);
  if (denied) return denied;

  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return fail("VALIDATION_ERROR", "Enter a valid stock quantity.", 422);

  const product = await prisma.product.findFirst({
    where: { id, vendor: { userId: guard.auth.user.id }, deletedAt: null },
    select: { id: true, name: true, vendorId: true },
  });
  if (!product) return fail("NOT_FOUND", "Product not found.", 404);

  if (parsed.data.variantId) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: parsed.data.variantId, productId: product.id },
      select: { id: true, name: true, stock: true },
    });
    if (!variant) return fail("NOT_FOUND", "Variant not found.", 404);
    const updated = await prisma.productVariant.update({
      where: { id: variant.id },
      data: { stock: parsed.data.quantity },
      select: { id: true, name: true, stock: true },
    });
    await writeAuditLog({
      actorId: guard.auth.user.id,
      action: "product.variant_stock_update",
      entityType: "ProductVariant",
      entityId: variant.id,
      before: { stock: variant.stock },
      after: { stock: updated.stock },
    });
    return ok({ variant: updated });
  }

  const before = await prisma.product.findUniqueOrThrow({
    where: { id: product.id },
    select: { quantity: true },
  });
  const updated = await prisma.product.update({
    where: { id: product.id },
    data: { quantity: parsed.data.quantity },
    select: { id: true, quantity: true },
  });
  await writeAuditLog({
    actorId: guard.auth.user.id,
    action: "product.stock_update",
    entityType: "Product",
    entityId: product.id,
    before: { quantity: before.quantity },
    after: { quantity: updated.quantity },
  });

  return ok({ product: updated });
}
