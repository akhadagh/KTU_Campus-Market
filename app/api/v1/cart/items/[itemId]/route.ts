import { fail, ok } from "@/lib/api-response";
import { findOwnedCart, getCartSummary } from "@/lib/cart";
import { prisma } from "@/lib/db";

export async function PATCH(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const cart = await findOwnedCart();
  if (!cart) return fail("NOT_FOUND", "Cart not found.", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const payload = body as { quantity?: unknown; variantId?: unknown };
  const quantity = Number(payload.quantity);
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 50) {
    return fail("VALIDATION_ERROR", "Quantity must be between 0 and 50.", 422);
  }
  const variantId =
    typeof payload.variantId === "string" && payload.variantId ? payload.variantId : undefined;

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    select: {
      id: true,
      product: { select: { quantity: true, status: true, id: true } },
      productId: true,
    },
  });
  if (!item) return fail("NOT_FOUND", "Cart item not found.", 404);
  if (quantity > item.product.quantity) {
    return fail("CONFLICT", `Only ${item.product.quantity} in stock.`, 409);
  }

  if (variantId !== undefined) {
    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, productId: item.productId, isActive: true },
      select: { id: true, stock: true },
    });
    if (!variant) return fail("VALIDATION_ERROR", "That option is not available.", 422);
    if (variant.stock < 1) return fail("CONFLICT", "That option is out of stock.", 409);
  }

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity, ...(variantId !== undefined ? { variantId } : {}) },
    });
  }

  const summary = await getCartSummary(cart.id);
  return ok({ updated: true, ...summary });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const { itemId } = await params;
  const cart = await findOwnedCart();
  if (!cart) return fail("NOT_FOUND", "Cart not found.", 404);

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    select: { id: true },
  });
  if (!item) return fail("NOT_FOUND", "Cart item not found.", 404);

  await prisma.cartItem.delete({ where: { id: itemId } });
  const summary = await getCartSummary(cart.id);
  return ok({ removed: true, ...summary });
}
