import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { listMarketplaceCategories, listMarketplaceProducts } from "@/lib/marketplace";
import { conditionLabels } from "@/lib/labels";
import { connection } from "next/server";

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
    page?: string;
  }>;
}

const conditionOptions = [
  "NEW",
  "LIKE_NEW",
  "USED_GOOD",
  "USED_FAIR",
  "REFURBISHED",
  "NOT_SPECIFIED",
];

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  await connection();

  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category ?? "";
  const condition = params.condition ?? "";
  const sort = params.sort ?? "newest";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const [categories, results] = await Promise.all([
    listMarketplaceCategories(),
    listMarketplaceProducts({ q: query, categorySlug: category, condition, sort, page }),
  ]);

  const buildUrl = (next: Record<string, string | undefined>) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (category) search.set("category", category);
    if (condition) search.set("condition", condition);
    if (sort !== "newest") search.set("sort", sort);
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value);
    }
    const qs = search.toString();
    return qs ? `/marketplace?${qs}` : "/marketplace";
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Explore marketplace"
        description="Browse live listings from approved campus vendors. New listings appear after administrator review."
      />

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
            defaultValue={query}
            placeholder="Search products and services"
          />
        </div>
        <div>
          <label htmlFor="category" className="mb-1 block text-xs font-medium text-neutral-700">
            Category
          </label>
          <Select id="category" name="category" defaultValue={category}>
            <option value="">All categories</option>
            {categories.map((item) => (
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
            {conditionOptions.map((option) => (
              <option key={option} value={option}>
                {conditionLabels[option]}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label htmlFor="sort" className="mb-1 block text-xs font-medium text-neutral-700">
            Sort
          </label>
          <div className="flex gap-2">
            <Select id="sort" name="sort" defaultValue={sort}>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="name">Name</option>
              <option value="rating">Highest rated</option>
            </Select>
            <Button type="submit" className="shrink-0">
              Apply
            </Button>
          </div>
        </div>
      </form>

      <div className="mt-6 flex items-center justify-between text-sm text-neutral-600">
        <p>
          {results.total} listing{results.total === 1 ? "" : "s"}
          {query ? ` for “${query}”` : ""}
        </p>
        <p>
          Page {results.page} of {results.pages}
        </p>
      </div>

      {results.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={PackageSearch}
            title="No listings match those filters"
            description="Try a different search term, or clear the filters to see everything on campus."
            action={
              <Link href="/marketplace" className={buttonVariants()}>
                Clear filters
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {results.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {results.pages > 1 ? (
        <nav aria-label="Pagination" className="mt-8 flex items-center justify-between">
          {results.page > 1 ? (
            <Link
              href={buildUrl({ page: String(results.page - 1) })}
              className={buttonVariants({ variant: "outline" })}
            >
              Previous
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm text-neutral-600">
            Page {results.page} of {results.pages}
          </span>
          {results.page < results.pages ? (
            <Link
              href={buildUrl({ page: String(results.page + 1) })}
              className={buttonVariants({ variant: "outline" })}
            >
              Next
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
