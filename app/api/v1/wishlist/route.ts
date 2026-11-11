import { fail, ok } from "@/lib/api-response";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) return fail("AUTH_REQUIRED", "Log in to see your wishlist.", 401);

  const wishlist = await prisma.wishlist.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      items: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          createdAt: true,
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              pricePesewas: true,
              originalPricePesewas: true,
              quantity: true,
              status: true,
              images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
              category: { select: { name: true } },
              vendor: { select: { storeName: true, slug: true, status: true } },
            },
          },
        },
      },
    },
  });

  return ok({
    items: (wishlist?.items ?? [])
      .filter((item) => item.product.status === "ACTIVE")
      .map((item) => ({
        id: item.id,
        createdAt: item.createdAt,
        product: {
          id: item.product.id,
          slug: item.product.slug,
          name: item.product.name,
          pricePesewas: item.product.pricePesewas,
          originalPricePesewas: item.product.originalPricePesewas,
          quantity: item.product.quantity,
          imageUrl: item.product.images[0]?.url ?? null,
          categoryName: item.product.category.name,
          vendorName: item.product.vendor.storeName,
          vendorSlug: item.product.vendor.slug,
        },
      })),
  });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return fail("AUTH_REQUIRED", "Log in to save favourites.", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("VALIDATION_ERROR", "Request body must be JSON.", 422);
  }
  const productId = (body as { productId?: unknown }).productId;
  if (typeof productId !== "string" || !productId) {
    return fail("VALIDATION_ERROR", "Choose a product.", 422);
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, status: "ACTIVE", deletedAt: null },
    select: { id: true, vendor: { select: { id: true } } },
  });
  if (!product) return fail("NOT_FOUND", "That product is not available.", 404);

  const wishlist = await prisma.wishlist.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id },
    update: {},
    select: { id: true },
  });

  const existing = await prisma.wishlistItem.findUnique({
    where: { wishlistId_productId: { wishlistId: wishlist.id, productId } },
    select: { id: true },
  });
  if (existing) {
    await prisma.wishlistItem.delete({ where: { id: existing.id } });
    return ok({ saved: false });
  }

  await prisma.wishlistItem.create({
    data: { wishlistId: wishlist.id, productId },
  });
  return ok({ saved: true }, { status: 201 });
}
