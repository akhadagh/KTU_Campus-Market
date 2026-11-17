import { ok } from "@/lib/api-response";
import { GUEST_CART_COOKIE } from "@/lib/cart";
import { cookies } from "next/headers";
import { requireApiAuth } from "@/lib/auth/api-guards";
import { prisma } from "@/lib/db";

/**
 * Merges a guest cart into the signed-in customer's cart. Guest items win on
 * quantity only when the same product (and option) is already present.
 */
export async function POST() {
  const guard = await requireApiAuth();
  if (guard.response) return guard.response;
  const { auth } = guard;

  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (!guestToken) return ok({ merged: 0 });

  const guestCart = await prisma.cart.findUnique({
    where: { guestToken },
    select: { id: true, items: { select: { productId: true, variantId: true, quantity: true } } },
  });
  if (!guestCart || guestCart.items.length === 0) {
    cookieStore.delete(GUEST_CART_COOKIE);
    return ok({ merged: 0 });
  }

  const userCart = await prisma.cart.upsert({
    where: { userId: auth.user.id },
    create: { userId: auth.user.id },
    update: {},
    select: { id: true },
  });

  let merged = 0;
  for (const item of guestCart.items) {
    const existing = await prisma.cartItem.findFirst({
      where: { cartId: userCart.id, productId: item.productId, variantId: item.variantId },
      select: { id: true, quantity: true },
    });
    if (existing) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { quantity: true },
      });
      const cap = Math.max(item.quantity, product?.quantity ?? item.quantity);
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: Math.min(existing.quantity + item.quantity, cap) },
      });
    } else {
      const vendor = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { vendorId: true },
      });
      await prisma.cartItem.create({
        data: {
          cartId: userCart.id,
          productId: item.productId,
          variantId: item.variantId,
          vendorId: vendor?.vendorId ?? "",
          quantity: item.quantity,
        },
      });
    }
    merged += 1;
  }

  await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
  await prisma.cart.delete({ where: { id: guestCart.id } });
  cookieStore.delete(GUEST_CART_COOKIE);

  return ok({ merged });
}
