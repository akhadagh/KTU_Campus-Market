import { prisma } from "@/lib/db";
import { Prisma } from "@/lib/generated/prisma/client";

export interface MarketplaceProduct {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pricePesewas: number;
  originalPricePesewas: number | null;
  condition: string;
  quantity: number;
  imageUrl: string | null;
  imageAlt: string | null;
  categoryName: string;
  categorySlug: string;
  vendorName: string;
  vendorSlug: string;
  campusName: string | null;
  ratingAvg: number;
  ratingCount: number;
  deliveryOptions: string[];
  pickupAvailable: boolean;
  purchaseMode: "INTERNAL" | "EXTERNAL";
  externalUrl: string | null;
  digitalDetails: { network?: string; dataAmount?: string; validity?: string } | null;
  createdAt: Date;
}

export interface MarketplaceQuery {
  q?: string;
  categorySlug?: string;
  condition?: string;
  vendorSlug?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

const productSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  pricePesewas: true,
  originalPricePesewas: true,
  condition: true,
  quantity: true,
  deliveryOptions: true,
  pickupAvailable: true,
  purchaseMode: true,
  externalUrl: true,
  digitalDetails: true,
  ratingAvg: true,
  ratingCount: true,
  createdAt: true,
  images: { select: { url: true, altText: true }, orderBy: { sortOrder: "asc" }, take: 1 },
  category: { select: { name: true, slug: true } },
  vendor: { select: { storeName: true, slug: true, campus: { select: { name: true } } } },
} satisfies Prisma.ProductSelect;

type ProductRow = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

function toProduct(row: ProductRow): MarketplaceProduct {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    pricePesewas: row.pricePesewas,
    originalPricePesewas: row.originalPricePesewas,
    condition: row.condition,
    quantity: row.quantity,
    imageUrl: row.images[0]?.url ?? null,
    imageAlt: row.images[0]?.altText ?? null,
    categoryName: row.category.name,
    categorySlug: row.category.slug,
    vendorName: row.vendor.storeName,
    vendorSlug: row.vendor.slug,
    campusName: row.vendor.campus?.name ?? null,
    ratingAvg: row.ratingAvg,
    ratingCount: row.ratingCount,
    deliveryOptions: row.deliveryOptions,
    pickupAvailable: row.pickupAvailable,
    purchaseMode: row.purchaseMode,
    externalUrl: row.externalUrl,
    digitalDetails: (row.digitalDetails ?? null) as {
      network?: string;
      dataAmount?: string;
      validity?: string;
    } | null,
    createdAt: row.createdAt,
  };
}

export async function listMarketplaceProducts(query: MarketplaceQuery): Promise<{
  items: MarketplaceProduct[];
  total: number;
  page: number;
  pageSize: number;
  pages: number;
}> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(48, Math.max(6, query.pageSize ?? 24));
  const search = query.q?.trim();

  const where: Prisma.ProductWhereInput = {
    status: "ACTIVE",
    deletedAt: null,
    ...(query.vendorSlug
      ? { vendor: { slug: query.vendorSlug, status: "ACTIVE" } }
      : { vendor: { status: "ACTIVE" } }),
    ...(query.categorySlug ? { category: { slug: query.categorySlug } } : {}),
    ...(query.condition ? { condition: query.condition as never } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { tags: { has: search.toLowerCase() } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    query.sort === "price_asc"
      ? [{ pricePesewas: "asc" }]
      : query.sort === "price_desc"
        ? [{ pricePesewas: "desc" }]
        : query.sort === "name"
          ? [{ name: "asc" }]
          : query.sort === "rating"
            ? [{ ratingAvg: "desc" }]
            : [{ createdAt: "desc" }];

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: productSelect,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: rows.map(toProduct),
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getMarketplaceProduct(slug: string): Promise<
  | (MarketplaceProduct & {
      vendor: {
        id: string;
        storeName: string;
        slug: string;
        description: string | null;
        phone: string | null;
        whatsapp: string | null;
        ratingAvg: number;
        ratingCount: number;
        pickupAvailable: boolean;
        deliveryAvailable: boolean;
      };
    })
  | null
> {
  const row = await prisma.product.findFirst({
    where: { slug, status: "ACTIVE", deletedAt: null, vendor: { status: "ACTIVE" } },
    select: {
      ...productSelect,
      variants: {
        where: { isActive: true },
        select: { id: true, name: true, sku: true, priceDeltaPesewas: true, stock: true },
        orderBy: { name: "asc" },
      },
      reviews: {
        where: { status: "PUBLISHED", deletedAt: null },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          buyer: { select: { fullName: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      vendor: {
        select: {
          id: true,
          storeName: true,
          slug: true,
          description: true,
          phone: true,
          whatsapp: true,
          ratingAvg: true,
          ratingCount: true,
          pickupAvailable: true,
          deliveryAvailable: true,
          campus: { select: { name: true } },
        },
      },
    },
  });
  if (!row) return null;
  return { ...toProduct(row), vendor: row.vendor };
}

export async function listMarketplaceCategories() {
  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      iconUrl: true,
      _count: { select: { products: true } },
    },
  });
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    type: category.type,
    iconUrl: category.iconUrl,
    productCount: category._count.products,
  }));
}

export async function listMarketplaceVendors(options: {
  q?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = Math.min(36, Math.max(6, options.pageSize ?? 12));
  const search = options.q?.trim();
  const where: Prisma.VendorProfileWhereInput = {
    status: "ACTIVE",
    deletedAt: null,
    ...(search
      ? {
          OR: [
            { storeName: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [vendors, total] = await Promise.all([
    prisma.vendorProfile.findMany({
      where,
      orderBy: [{ storeName: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        storeName: true,
        slug: true,
        description: true,
        businessCategory: true,
        ratingAvg: true,
        ratingCount: true,
        pickupAvailable: true,
        deliveryAvailable: true,
        campus: { select: { name: true } },
        _count: { select: { products: true } },
      },
    }),
    prisma.vendorProfile.count({ where }),
  ]);

  return {
    items: vendors.map((vendor) => ({
      id: vendor.id,
      storeName: vendor.storeName,
      slug: vendor.slug,
      description: vendor.description,
      businessCategory: vendor.businessCategory,
      ratingAvg: vendor.ratingAvg,
      ratingCount: vendor.ratingCount,
      pickupAvailable: vendor.pickupAvailable,
      deliveryAvailable: vendor.deliveryAvailable,
      campusName: vendor.campus?.name ?? null,
      productCount: vendor._count.products,
    })),
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
