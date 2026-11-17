import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { MarketplaceSidebar } from "@/components/marketplace/marketplace-sidebar";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { listMarketplaceProducts, listMarketplaceVendors } from "@/lib/marketplace";
import { conditionLabels } from "@/lib/labels";
import { connection } from "next/server";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Explore marketplace",
  description: "Browse products and services from verified campus vendors.",
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
  return (
    <Suspense fallback={<MarketplaceSkeleton />}>
      <MarketplaceResults searchParams={searchParams} />
    </Suspense>
  );
}

function MarketplaceSkeleton() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="skeleton h-10 w-48 rounded-lg" />
      <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
        <div className="skeleton h-24 w-28 rounded-xl" />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="skeleton h-72 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

async function MarketplaceResults({ searchParams }: { searchParams: Promise<MarketplacePageProps["searchParams"]> }) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const category = params.category ?? "";
  const condition = params.condition ?? "";
  const sort = params.sort ?? "newest";
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  const session = await getSession();

  const [results, categories, frequentlyBoughtTogether, stores] = await Promise.all([
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
          select: { id: true, name: true, slug: true },
        },
      },
    }),
    listMarketplaceProducts({ sort: "rating", pageSize: 4 }),
    listMarketplaceVendors({ pageSize: 6 }),
  ]);

  const sidebarCategories = categories
    .filter((item) => !isHiddenCategory(item))
    .map((item) => ({
      name: item.name,
      slug: item.slug,
      productCount: item._count.products,
      children: item.children.map((child) => ({
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
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Explore marketplace"
        description="Browse products and services from verified campus vendors."
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[15rem_1fr] lg:gap-8">
        <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <MarketplaceSidebar
            categories={sidebarCategories}
            activeSlug={category}
            stores={stores.items.map((store) => ({
              slug: store.slug,
              storeName: store.storeName,
              businessCategory: store.businessCategory,
              productCount: store.productCount,
            }))}
            frequentPairs={frequentlyBoughtTogether.map((pair) => ({
              a: pair.a,
              b: pair.b,
              orders: pair.orders,
            }))}
          />
        </aside>

        <div className="min-w-0">
          <form action="/marketplace" method="get" className="flex flex-wrap items-end gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)]">
            <div className="relative w-full">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
              <Input
                id="marketplace-search"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search products and services"
                className="h-11 rounded-full pl-10 bg-neutral-100"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
              <div>
                <label htmlFor="marketplace-condition" className="mb-1 block text-xs font-medium text-neutral-700">
                  Condition
                </label>
                <Select id="marketplace-condition" name="condition" defaultValue={condition} className="h-10 w-full">
                  <option value="">Any condition</option>
                  {conditionOptions.map((option) => (
                    <option key={option} value={option}>
                      {conditionLabels[option]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="h-10 w-full bg-brand-700 text-white font-semibold">
                  Apply filters
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
            <span>
              {results.total} listing{results.total === 1 ? "" : "s"}
              {query ? ` for “${query}”` : ""}
            </span>
            <span>Page {results.page} of {results.pages}</span>
          </div>

          {results.items.length === 0 ? (
            <div className="mt-4">
              <EmptyState icon={PackageSearch} title="No listings match those filters" description="Try another category, clear the filters, or browse what other students are buying." action={<Link href="/marketplace" className={buttonVariants()}>Clear filters</Link>} />
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {results.items.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {results.pages > 1 ? (
            <nav aria-label="Pagination" className="mt-8 flex items-center justify-between">
              {results.page > 1 ? (
                <Link href={buildUrl({ page: String(results.page - 1) })} className={buttonVariants({ variant: "outline" })}>
                  Previous
                </Link>
              ) : (
                <span />
              )}
              <span className="text-sm text-neutral-600">Page {results.page} of {results.pages}</span>
              {results.page < results.pages ? (
                <Link href={buildUrl({ page: String(results.page + 1) })} className={buttonVariants({ variant: "outline" })}>
                  Next
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}

export interface CategorySidebarItem {
  name: string;
  slug: string;
  productCount: number;
  children: {
    name: string;
    slug: string;
    productCount: number;
  }[];
}

export interface SidebarStore {
  slug: string;
  storeName: string;
  businessCategory: string | null;
  productCount: number;
}

export interface FrequentPair {
  a: { id: string; slug: string; name: string; pricePesewas: number };
  b: { id: string; slug: string; name: string; pricePesewas: number };
  orders: number;
}

function MarketplaceSidebar({
  categories,
  activeSlug,
  stores,
  frequentPairs,
}: {
  categories: CategorySidebarItem[];
  activeSlug: string;
  stores: SidebarStore[];
  frequentPairs: FrequentPair[];
}) {
  const [open, setOpen] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  return (
    <>
      <button type="button" onClick={() => setOpen((o) => !open)} className="focus-visible:ring-brand-500 flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors focus-visible:ring-2 focus-visible:outline-none">
        <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:block text-sm font-semibold text-neutral-900">Categories</span>
        {open ? <ChevronUp className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
      </button>
      <nav className={cn(
        "fixed inset-y-0 left-0 z-50 flex-col bg-white shadow-2xl transition-all duration-300",
        open ? "w-[260px] translate-x-0" : "-translate-x-full hidden lg:block"
      )}>
        <div className="flex items-center justify-between gap-3 px-4 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-2">
            <JumartMark className="h-8 w-12" />
            <JumartWordmark className="text-2xl font-bold tracking-tight text-brand-700" />
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation" className="grid h-9 w-9 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 focus-visible:ring-brand-500/30 focus-visible:ring-2 focus-visible:outline-none">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-2 pb-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">Categories</p>
          <ul className="space-y-1">
            {categories.map((category) => (
              <li key={category.slug}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedCategory(expandedCategory === category.slug ? null : category.slug)}
                    aria-expanded={expandedCategory === category.slug}
                    className="flex w-full items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium transition-colors"
                    className={cn(
                      "flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium transition-colors",
                      activeSlug === category.slug ? "bg-brand-50 text-brand-700" : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                    )}
                  >
                    <span className="truncate text-sm">{category.name}</span>
                    <span className="text-xs text-neutral-400">{category.productCount}</span>
                    <ChevronDown className="h-3 w-3 shrink-0 text-neutral-400" aria-hidden="true" />
                  </button>
                  {expandedCategory === category.slug && category.children.length > 0 ? (
                    <ul className="mt-1 space-y-1">
                      {category.children.map((child) => (
                        <li key={child.slug}>
                          <Link
                            href={`/marketplace?category=${child.slug}`}
                            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-brand-700"
                          >
                            <span className="truncate">{child.name}</span>
                            <span className="text-xs text-neutral-400">{child.productCount}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold text-neutral-900">Stores in the Marketplace</p>
            <Badge variant="muted">{stores.length}</Badge>
          </div>
          <ul className="space-y-1">
            {stores.map((store) => (
              <li key={store.slug}>
                <Link
                  href={`/stores/${store.slug}`}
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-brand-700"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-900">{store.storeName}</p>
                    {store.businessCategory ? (
                      <p className="text-xs text-neutral-500">{store.businessCategory}</p>
                    ) : null}
                    <span className="text-xs font-medium text-neutral-700">{store.productCount}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        {frequentPairs.length > 0 ? (
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <ShoppingBag className="h-4 w-4 text-accent-500" aria-hidden="true" />
            Frequently Bought Together
          </div>
          <div className="mt-2 space-y-2">
            {frequentPairs.map(({ productA, productB }) => (
              <li key={`${productA.slug}-${productB.slug}`}>
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white p-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/products/${productA.slug}`} className="text-sm font-semibold text-neutral-900 hover:underline">
                      {productA.name}
                    </Link>
                    <span className="text-xs text-neutral-500">{formatPesewas(productA.pricePesewas)}</span>
                  </div>
                  <div className="min-w-0 flex-1 text-right">
                    <Link href={`/products/${productB.slug}`} className="text-sm font-medium text-neutral-900 hover:underline">
                      {productB.name}
                    </Link>
                  </div>
                </div>
              ))}
            </ul>
          ) : null}
        </div>
      </nav>
    </>
  );
}