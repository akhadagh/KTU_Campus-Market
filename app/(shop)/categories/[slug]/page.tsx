import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/db";
import { listMarketplaceProducts } from "@/lib/marketplace";
import { connection } from "next/server";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true },
  });
  return { title: category?.name ?? "Category" };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  await connection();

  const { slug } = await params;
  const query = await searchParams;
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { name: true, id: true, type: true },
  });
  if (!category) notFound();

  const page = Math.max(1, Number(query.page ?? "1") || 1);
  const results = await listMarketplaceProducts({ categorySlug: slug, page });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title={category.name}
        description={`${results.total} live listing${results.total === 1 ? "" : "s"} in this category.`}
      />

      {results.items.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {results.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={PackageSearch}
            title="No listings in this category yet"
            description="Approved vendor listings appear here as soon as they are published."
          />
        </div>
      )}
    </div>
  );
}
