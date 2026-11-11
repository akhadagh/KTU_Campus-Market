import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProductForm } from "@/components/vendor/product-form";
import { requireVendor } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireVendor();
  const { id } = await params;
  const [product, categories] = await Promise.all([
    prisma.product.findFirst({
      where: { id, vendorId: auth.vendorId, deletedAt: null },
      select: {
        id: true,
        name: true,
        categoryId: true,
        description: true,
        pricePesewas: true,
        originalPricePesewas: true,
        condition: true,
        quantity: true,
        deliveryOptions: true,
        pickupAvailable: true,
        tags: true,
        status: true,
        purchaseMode: true,
        externalUrl: true,
        digitalDetails: true,
        images: { select: { url: true }, orderBy: { sortOrder: "asc" } },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true, type: "PRODUCT" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true },
    }),
  ]);
  if (!product) notFound();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Edit product"
        description="Changes to published products may require review."
      />
      <Card className="mt-6 p-6">
        <ProductForm
          categories={categories}
          product={{
            id: product.id,
            name: product.name,
            categoryId: product.categoryId,
            description: product.description ?? "",
            pricePesewas: product.pricePesewas,
            originalPricePesewas: product.originalPricePesewas,
            condition: product.condition,
            quantity: product.quantity,
            deliveryOptions: product.deliveryOptions,
            pickupAvailable: product.pickupAvailable,
            tags: product.tags,
            imageUrls: product.images.map((image) => image.url),
            status: product.status,
            purchaseMode: product.purchaseMode,
            externalUrl: product.externalUrl,
            digitalDetails: product.digitalDetails as {
              network?: string;
              dataAmount?: string;
              validity?: string;
            } | null,
          }}
        />
      </Card>
    </div>
  );
}
