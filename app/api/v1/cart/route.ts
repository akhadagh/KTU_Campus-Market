import { fail, ok } from "@/lib/api-response";
import { getOrCreateCart, getCartSummary } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { clientIp, rateLimitWith } from "@/lib/rate-limit";

export async function GET() {
  const cart = await getOrCreateCart();
  const summary = await getCartSummary(cart.id);
  return ok({ cart: { id: cart.id }, ...summary });
}

export async function POST(request: Request) {
  const cartLimit = await rateLimitWith(`cart-add:${clientIp(request)}`, 60, {
    windowMs: 60_000,
    failClosed: false,
  });
  if (!cartLimit.allowed) {
    return fail("RATE_LIMITED", "Too many cart updates. Slow down.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const data = body as { productId?: unknown; quantity?: unknown };
  const productId = typeof data.productId === "string" ? data.productId : "";
  const quantity = Number(data.quantity ?? 1);
  if (!productId) return fail("VALIDATION_ERROR", "Choose a product to add.", 422);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
    return fail("VALIDATION_ERROR", "Quantity must be between 1 and 50.", 422);
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, status: "ACTIVE", deletedAt: null, vendor: { status: "ACTIVE" } },
    select: { id: true, vendorId: true, quantity: true, name: true },
  });
  if (!product) return fail("NOT_FOUND", "That product is not available.", 404);
  if (product.quantity < 1) return fail("CONFLICT", "That product is out of stock.", 409);

  const cart = await getOrCreateCart();
  const existing = await prisma.cartItem.findFirst({
    where: { cartId: cart.id, productId: product.id, variantId: null },
    select: { id: true, quantity: true },
  });

  const nextQuantity = Math.min((existing?.quantity ?? 0) + quantity, product.quantity);
  if (existing) {
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: nextQuantity } });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: product.id,
        vendorId: product.vendorId,
        quantity: nextQuantity,
      },
    });
  }

  const summary = await getCartSummary(cart.id);
  return ok({ added: true, quantity: nextQuantity, ...summary }, { status: 201 });
}
