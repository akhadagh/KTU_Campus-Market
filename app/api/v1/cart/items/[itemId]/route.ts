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
  const quantity = Number((body as { quantity?: unknown }).quantity);
  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 50) {
    return fail("VALIDATION_ERROR", "Quantity must be between 0 and 50.", 422);
  }

  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, cartId: cart.id },
    select: { id: true, product: { select: { quantity: true, status: true } } },
  });
  if (!item) return fail("NOT_FOUND", "Cart item not found.", 404);
  if (quantity > item.product.quantity) {
    return fail("CONFLICT", `Only ${item.product.quantity} in stock.`, 409);
  }

  if (quantity === 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
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
