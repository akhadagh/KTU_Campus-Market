import type { Metadata } from "next";
import { PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { sampleCategories, sampleProducts } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Explore marketplace",
  description: "Browse products and services from campus vendors at KTU.",
};

interface MarketplacePageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    condition?: string;
    sort?: string;
  }>;
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const params = await searchParams;
  const query = params.q?.trim().toLowerCase() ?? "";
  const category = params.category ?? "";
  const condition = params.condition ?? "";
  const sort = params.sort ?? "relevance";

  let results = sampleProducts.filter((product) => {
    const matchesQuery =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.description.toLowerCase().includes(query) ||
      product.categoryName.toLowerCase().includes(query);
    const matchesCategory = !category || product.categorySlug === category;
    const matchesCondition = !condition || product.condition === condition;
    return matchesQuery && matchesCategory && matchesCondition;
  });

  if (sort === "price_asc") results = [...results].sort((a, b) => a.pricePesewas - b.pricePesewas);
  if (sort === "price_desc") results = [...results].sort((a, b) => b.pricePesewas - a.pricePesewas);
  if (sort === "name") results = [...results].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Explore marketplace"
        description="Browse products and services from the campus community. Filters below work against sample preview data until the marketplace database is connected."
      />

      <Alert variant="warning" title="Design preview" className="mt-6">
        Only sample listings are shown right now. Real database-backed vendor listings arrive in
        Milestone 4.
      </Alert>

      <form
        action="/marketplace"
        method="get"
        className="mt-6 grid gap-3 rounded-xl border border-neutral-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="lg:col-span-2">
          <label htmlFor="search" className="mb-1 block text-xs font-medium text-neutral-700">
            Search
          </label>
          <Input
            id="search"
            name="q"
            type="search"
            defaultValue={params.q ?? ""}
            placeholder="Search products and services"
          />
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-xs font-medium text-neutral-700">
            Category
          </label>
          <Select id="category" name="category" defaultValue={category}>
            <option value="">All categories</option>
            {sampleCategories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="condition" className="mb-1 block text-xs font-medium text-neutral-700">
            Condition
          </label>
          <Select id="condition" name="condition" defaultValue={condition}>
            <option value="">Any condition</option>
            <option value="New">New</option>
            <option value="Used">Used</option>
            <option value="Refurbished">Refurbished</option>
          </Select>
        </div>
        <div>
          <label htmlFor="sort" className="mb-1 block text-xs font-medium text-neutral-700">
            Sort
          </label>
          <div className="flex gap-2">
            <Select id="sort" name="sort" defaultValue={sort}>
              <option value="relevance">Relevance</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="name">Name</option>
            </Select>
            <Button type="submit" className="shrink-0">
              Apply
            </Button>
          </div>
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm text-neutral-600">
        <p>
          {results.length} {results.length === 1 ? "result" : "results"}
          {params.q ? ` for “${params.q}”` : ""}
        </p>
      </div>

      {results.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            icon={PackageSearch}
            title="No listings match your search"
            description="Try a different keyword, category, or condition. Real marketplace search will query vendor listings once the database is connected."
          />
        </div>
      )}
    </div>
  );
}
