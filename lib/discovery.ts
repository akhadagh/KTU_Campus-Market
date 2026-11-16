import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

/**
 * Categories that must never appear in the marketplace navigation.
 * The catalogue is database driven, so these are filtered by name and slug.
 */
export const HIDDEN_CATEGORY_NAMES = new Set(["Data and Bundle", "AI Integrations"]);

export function isHiddenCategory(category: { name: string; slug: string }): boolean {
  return (
    HIDDEN_CATEGORY_NAMES.has(category.name) ||
    category.slug === "data-and-bundle" ||
    category.slug === "ai-integrations"
  );
}

export interface DiscoveryOptions {
  userId?: string | null;
  limit?: number;
  excludeIds?: string[];
}

/**
 * Records a product view. Used for "recently viewed" and as a discovery
 * signal. Views are only recorded for real catalogue pages.
 */
export async function recordProductView(productId: string, userId: string | null): Promise<void> {
  try {
    await prisma.productView.create({ data: { productId, userId: userId ?? null } });
  } catch {
    // A failed view must never break the page.
  }
}

/**
 * Products the student looked at recently, newest first.
 */
export async function listRecentlyViewed(
  userId: string | null,
  limit = 8,
): Promise<
  { id: string; slug: string; name: string; pricePesewas: number; imageUrl: string | null }[]
> {
  if (!userId) return [];
  const views = await prisma.productView.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    take: 60,
    select: { productId: true },
  });
  const uniqueIds = [...new Set(views.map((view) => view.productId))].slice(0, limit);
  if (uniqueIds.length === 0) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: uniqueIds }, status: "ACTIVE", deletedAt: null },
    select: {
      id: true,
      slug: true,
      name: true,
      pricePesewas: true,
      images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  const order = new Map(uniqueIds.map((id, index) => [id, index]));
  return products
    .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99))
    .map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      pricePesewas: product.pricePesewas,
      imageUrl: product.images[0]?.url ?? null,
    }));
}

/**
 * A varied shortlist: recent arrivals, well rated listings and products from
 * other vendors, so a student is not shown the same shelf on every visit.
 */
export async function listDiscoveryShelf(
  options: DiscoveryOptions,
): Promise<Prisma.ProductGetPayload<{ select: typeof discoverySelect }>[]> {
  const limit = Math.min(16, Math.max(4, options.limit ?? 8));
  const exclude = options.excludeIds ?? [];

  const base: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    deletedAt: null,
    quantity: { gt: 0 },
    vendor: { status: "ACTIVE" },
    ...(exclude.length > 0 ? { id: { notIn: exclude } } : {}),
  };

  const [recent, rated] = await Promise.all([
    prisma.product.findMany({
      where: base,
      orderBy: { publishedAt: "desc" },
      take: limit,
      select: discoverySelect,
    }),
    prisma.product.findMany({
      where: base,
      orderBy: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
      take: limit,
      select: discoverySelect,
    }),
  ]);

  const merged = [...recent, ...rated].filter(
    (product, index, all) => all.findIndex((item) => item.id === product.id) === index,
  );

  // Interleave so the same vendor does not dominate the shelf.
  const byVendor = new Map<string, typeof merged>();
  for (const product of merged) {
    const list = byVendor.get(product.vendor.id) ?? [];
    list.push(product);
    byVendor.set(product.vendor.id, list);
  }
  const interleaved: typeof merged = [];
  let index = 0;
  while (interleaved.length < limit) {
    let added = false;
    for (const list of byVendor.values()) {
      if (list[index]) {
        interleaved.push(list[index]);
        added = true;
        if (interleaved.length >= limit) break;
      }
    }
    if (!added) break;
    index += 1;
  }

  return interleaved.slice(0, limit);
}

const discoverySelect = {
  id: true,
  slug: true,
  name: true,
  pricePesewas: true,
  originalPricePesewas: true,
  quantity: true,
  condition: true,
  ratingAvg: true,
  ratingCount: true,
  deliveryOptions: true,
  pickupAvailable: true,
  purchaseMode: true,
  externalStatus: true,
  externalUrl: true,
  digitalDetails: true,
  publishedAt: true,
  images: { select: { url: true, altText: true }, orderBy: { sortOrder: "asc" }, take: 1 },
  category: { select: { name: true, slug: true } },
  vendor: { select: { id: true, storeName: true, slug: true, campus: { select: { name: true } } } },
} satisfies Prisma.ProductSelect;
