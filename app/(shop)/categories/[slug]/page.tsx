import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getSampleCategory, sampleProducts } from "@/lib/sample-data";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = getSampleCategory(slug);
  return {
    title: category ? category.name : "Category",
    description: category?.description,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = getSampleCategory(slug);

  if (!category) notFound();

  const products = sampleProducts.filter((product) => product.categorySlug === slug);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title={category.name} description={category.description} />

      <Alert variant="warning" title="Design preview" className="mt-6">
        These are sample listings. Real category listings will come from the database.
      </Alert>

      {products.length > 0 ? (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={PackageSearch}
            title="No listings in this category yet"
            description="Vendors will be able to publish listings here once the marketplace core is connected."
          />
        </div>
      )}
    </div>
  );
}
