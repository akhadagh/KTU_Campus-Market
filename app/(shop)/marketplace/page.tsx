import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { MarketplaceSidebar } from "@/components/marketplace/marketplace-sidebar";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  isHiddenCategory,
  listFrequentlyBoughtTogether,
  listRecentlyViewed,
} from "@/lib/discovery";
import { listMarketplaceProducts, listMarketplaceVendors } from "@/lib/marketplace";
import { conditionLabels } from "@/lib/labels";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Explore marketplace",
  description: "Browse products and services from verified campus vendors.",
};

interface MarketplaceSearchParams {
  q?: string;
  category?: string;
  condition?: string;
  sort?: string;
  page?: string;
}

interface MarketplacePageProps {
  searchParams: Promise<MarketplaceSearchParams>;
}

const conditionOptions = [
  "NEW",
  "LIKE_NEW",
  "USED_GOOD",
  "USED_FAIR",
  "REFURBISHED",
  "NOT_SPECIFIED",
];

export default function MarketplacePage({ searchParams }: MarketplacePageProps) {
  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <MarketplaceResults searchParams={searchParams} />
    </Suspense>
  );
}

function MarketplaceSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="skeleton h-10 w-64 rounded-lg" />
      <div className="skeleton mt-6 h-12 w-full rounded-2xl" />
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="skeleton h-72 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

async function MarketplaceResults({
  searchParams,
}: {
  searchParams: Promise<MarketplaceSearchParams>;
}) {
  await connection();
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category ?? "";
  const condition = params.condition ?? "";
  const sort = params.sort ?? "newest";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const session = await getSession();

  const [results, categories, shelf, recentlyViewed, stores, frequentPairs] = await Promise.all([
    listMarketplaceProducts({ q: query, categorySlug: category, condition, sort, page }),
    prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        _count: { select: { products: true } },
        children: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            _count: { select: { products: true } },
          },
        },
      },
    }),
    listMarketplaceProducts({ sort: "rating", pageSize: 4 }),
    listRecentlyViewed(session?.user.id ?? null, 8),
    listMarketplaceVendors({ pageSize: 6 }),
    listFrequentlyBoughtTogether(4),
  ]);

  const sidebarCategories = categories
    .filter((item) => !isHiddenCategory(item))
    .map((item) => ({
      name: item.name,
      slug: item.slug,
      productCount: item._count.products,
      children: item.children
        .filter((child) => !isHiddenCategory(child))
        .map((child) => ({
          name: child.name,
          slug: child.slug,
          productCount: child._count.products,
        })),
    }));

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
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Explore marketplace"
        description="Live listings from approved campus vendors. Search from the header, then narrow the results here."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_1fr] lg:gap-8">
        <aside className="lg:pt-1">
          <MarketplaceSidebar
            categories={sidebarCategories}
            activeSlug={category}
            stores={stores.items.map((store) => ({
              slug: store.slug,
              storeName: store.storeName,
              businessCategory: store.businessCategory,
              productCount: store.productCount,
            }))}
            frequentPairs={frequentPairs.map((pair) => ({
              a: pair.a,
              b: pair.b,
              orders: pair.orders,
            }))}
          />
        </aside>

        <div className="min-w-0">
          <form
            action="/marketplace"
            method="get"
            className="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)]"
          >
            {query ? <input type="hidden" name="q" value={query} /> : null}
            {category ? <input type="hidden" name="category" value={category} /> : null}
            <div className="w-full sm:w-44">
              <label
                htmlFor="marketplace-condition"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Condition
              </label>
              <Select
                id="marketplace-condition"
                name="condition"
                defaultValue={condition}
                className="h-10"
              >
                <option value="">Any condition</option>
                {conditionOptions.map((option) => (
                  <option key={option} value={option}>
                    {conditionLabels[option]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-full sm:w-44">
              <label
                htmlFor="marketplace-sort"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Sort by
              </label>
              <Select id="marketplace-sort" name="sort" defaultValue={sort} className="h-10">
                <option value="newest">Newest first</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="name">Name</option>
                <option value="rating">Highest rated</option>
              </Select>
            </div>
            <Button type="submit" className="h-10">
              Apply filters
            </Button>
            {query || condition ? (
              <Link
                href={category ? `/marketplace?category=${category}` : "/marketplace"}
                className={buttonVariants({ variant: "ghost" })}
              >
                Clear filters
              </Link>
            ) : null}
          </form>

          <div className="mt-5 flex items-center justify-between text-sm text-neutral-600">
            <p>
              {results.total} listing{results.total === 1 ? "" : "s"}
              {query ? ` for “${query}”` : ""}
            </p>
            <p>
              Page {results.page} of {results.pages}
            </p>
          </div>

          {results.items.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={PackageSearch}
                title="No listings match those filters"
                description="Try another category, clear the filters, or browse what other students are buying."
                action={
                  <Link href="/marketplace" className={buttonVariants()}>
                    Clear filters
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
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

          {recentlyViewed.length > 0 ? (
            <section className="mt-10">
              <h2 className="text-lg font-semibold tracking-tight text-neutral-900">
                Recently viewed
              </h2>
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                {recentlyViewed.map((item) => (
                  <Link
                    key={item.id}
                    href={`/products/${item.slug}`}
                    className="group w-40 shrink-0"
                  >
                    <div className="aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <p className="group-hover:text-brand-700 mt-2 line-clamp-2 text-sm font-medium text-neutral-900">
                      {item.name}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          {shelf.items.length > 0 ? (
            <section className="mt-12">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-neutral-900">
                <Sparkles className="text-accent-500 h-4 w-4" aria-hidden="true" />
                Popular right now
              </h2>
              <p className="mt-1 text-sm text-neutral-600">
                The listings students are rating highest this week.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {shelf.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
