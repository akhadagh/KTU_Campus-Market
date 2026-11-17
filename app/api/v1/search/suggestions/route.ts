import { ok } from "@/lib/api-response";
import { prisma } from "@/lib/db";

/** Autocomplete for the header search: matching product names and categories. */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return ok({ suggestions: [] });

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "ACTIVE",
        deletedAt: null,
        vendor: { status: "ACTIVE", isDemo: false },
        name: { contains: q, mode: "insensitive" },
      },
      take: 5,
      select: { name: true, slug: true },
    }),
    prisma.category.findMany({
      where: { isActive: true, name: { contains: q, mode: "insensitive" } },
      take: 3,
      select: { name: true, slug: true },
    }),
  ]);

  return ok({
    suggestions: [
      ...products.map((product) => ({
        type: "product" as const,
        label: product.name,
        href: `/products/${product.slug}`,
      })),
      ...categories.map((category) => ({
        type: "category" as const,
        label: category.name,
        href: `/marketplace?category=${category.slug}`,
      })),
    ],
  });
}
