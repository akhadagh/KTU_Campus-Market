import type { Metadata } from "next";
import { CategoryCard } from "@/components/commerce/category-card";
import { Alert } from "@/components/ui/alert";
import { PageHeader } from "@/components/ui/page-header";
import { sampleCategories } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Categories",
  description: "Browse all Campus Market categories and subcategories.",
};

export default function CategoriesPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Browse categories"
        description="Find products and services by category. Administrators will be able to manage this structure without code changes."
      />

      <Alert variant="warning" title="Design preview" className="mt-6">
        Category records are sample preview data until the database is connected in Milestone 3–4.
      </Alert>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sampleCategories.map((category) => (
          <CategoryCard key={category.slug} category={category} />
        ))}
      </div>
    </div>
  );
}
