import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const GUEST_CART_COOKIE = "cm_guest";

export interface CartRecord {
  id: string;
  userId: string | null;
  guestToken: string | null;
}

export async function getOrCreateCart(): Promise<CartRecord> {
  const session = await getSession();
  if (session) {
    const cart = await prisma.cart.upsert({
      where: { userId: session.user.id },
      create: { userId: session.user.id },
      update: {},
      select: { id: true, userId: true, guestToken: true },
    });
    return cart;
  }

  const cookieStore = await cookies();
  const existing = cookieStore.get(GUEST_CART_COOKIE)?.value;
  const guestToken = existing ?? randomUUID();
  if (!existing) {
    cookieStore.set(GUEST_CART_COOKIE, guestToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }

  const cart = await prisma.cart.upsert({
    where: { guestToken },
    create: { guestToken },
    update: {},
    select: { id: true, userId: true, guestToken: true },
  });
  return cart;
}

export async function findOwnedCart(): Promise<CartRecord | null> {
  const session = await getSession();
  if (session) {
    return prisma.cart.findUnique({
      where: { userId: session.user.id },
      select: { id: true, userId: true, guestToken: true },
    });
  }
  const cookieStore = await cookies();
  const guestToken = cookieStore.get(GUEST_CART_COOKIE)?.value;
  if (!guestToken) return null;
  return prisma.cart.findUnique({
    where: { guestToken },
    select: { id: true, userId: true, guestToken: true },
  });
}

export interface CartLine {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  imageUrl: string | null;
  unitPricePesewas: number;
  quantity: number;
  lineTotalPesewas: number;
  stock: number;
  vendorId: string;
  vendorName: string;
  vendorSlug: string;
}

export interface CartSummary {
  items: CartLine[];
  subtotalPesewas: number;
  itemCount: number;
  vendorCount: number;
}

export async function getCartSummary(cartId: string): Promise<CartSummary> {
  const items = await prisma.cartItem.findMany({
    where: { cartId },
    orderBy: { addedAt: "asc" },
    select: {
      id: true,
      quantity: true,
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          pricePesewas: true,
          quantity: true,
          status: true,
          images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
          vendor: { select: { id: true, storeName: true, slug: true, status: true } },
        },
      },
    },
  });

  const lines: CartLine[] = items
    .filter((item) => item.product.status === "ACTIVE" && item.product.vendor.status === "ACTIVE")
    .map((item) => ({
      id: item.id,
      productId: item.product.id,
      productSlug: item.product.slug,
      productName: item.product.name,
      imageUrl: item.product.images[0]?.url ?? null,
      unitPricePesewas: item.product.pricePesewas,
      quantity: item.quantity,
      lineTotalPesewas: item.product.pricePesewas * item.quantity,
      stock: item.product.quantity,
      vendorId: item.product.vendor.id,
      vendorName: item.product.vendor.storeName,
      vendorSlug: item.product.vendor.slug,
    }));

  return {
    items: lines,
    subtotalPesewas: lines.reduce((total, line) => total + line.lineTotalPesewas, 0),
    itemCount: lines.reduce((total, line) => total + line.quantity, 0),
    vendorCount: new Set(lines.map((line) => line.vendorId)).size,
  };
}
