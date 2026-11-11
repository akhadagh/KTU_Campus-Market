import { fail, ok } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: {
      slug,
      status: "ACTIVE",
      deletedAt: null,
      vendor: { status: "ACTIVE" },
      OR: [{ purchaseMode: "INTERNAL" }, { externalStatus: "APPROVED" }],
    },
    select: {
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
      externalStatus: true,
      externalUrl: true,
      digitalDetails: true,
      ratingAvg: true,
      ratingCount: true,
      images: { select: { url: true, altText: true }, orderBy: { sortOrder: "asc" } },
      category: { select: { name: true, slug: true } },
      vendor: { select: { id: true, storeName: true, slug: true, status: true } },
    },
  });
  if (!product) return fail("NOT_FOUND", "Product not found.", 404);

  return ok({ product });
}
