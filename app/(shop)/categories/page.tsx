import type { Metadata } from "next";
import { CategoryCard } from "@/components/commerce/category-card";
import { PageHeader } from "@/components/ui/page-header";
import { listMarketplaceCategories } from "@/lib/marketplace";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse all Campus Market categories and subcategories.",
};

export default async function CategoriesPage() {
  await connection();

  const categories = await listMarketplaceCategories();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Browse categories"
        description="Find products and services by category. Counts reflect live listings."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={{
              name: category.name,
              slug: category.slug,
              type: category.type,
              productCount: category.productCount,
            }}
          />
        ))}
      </div>
    </div>
  );
}
