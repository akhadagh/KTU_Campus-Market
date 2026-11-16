import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CategorySidebarItem {
  name: string;
  slug: string;
  productCount: number;
  children: { name: string; slug: string; productCount: number }[];
}

export function CategorySidebar({
  categories,
  activeSlug,
}: {
  categories: CategorySidebarItem[];
  activeSlug: string;
}) {
  return (
    <>
      <details className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)] lg:hidden">
        <summary className="cursor-pointer text-sm font-semibold text-neutral-900">
          Categories
          {activeSlug ? (
            <span className="ml-2 text-xs font-normal text-neutral-500">
              ({categories.find((category) => category.slug === activeSlug)?.name ?? activeSlug})
            </span>
          ) : null}
        </summary>
        <div className="mt-3">{renderList(categories, activeSlug)}</div>
      </details>
      <nav
        aria-label="Product categories"
        className="hidden lg:sticky lg:top-20 lg:block lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
      >
        {renderList(categories, activeSlug)}
      </nav>
    </>
  );
}

function renderList(categories: CategorySidebarItem[], activeSlug: string) {
  return (
    <nav aria-label="Product categories" className="lg:contents">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
        <LayoutGrid className="text-brand-600 h-4 w-4" aria-hidden="true" />
        Categories
      </p>
      <ul className="space-y-1">
        <li>
          <Link
            href="/marketplace"
            aria-current={activeSlug === "" ? "page" : undefined}
            className={cn(
              "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              activeSlug === ""
                ? "bg-brand-700 text-white"
                : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
            )}
          >
            All categories
            <span
              className={cn("text-xs", activeSlug === "" ? "text-white/70" : "text-neutral-400")}
            >
              {categories.reduce((total, category) => total + category.productCount, 0)}
            </span>
          </Link>
        </li>
        {categories.map((category) => {
          const active = activeSlug === category.slug;
          return (
            <li key={category.slug}>
              <Link
                href={`/marketplace?category=${category.slug}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-700 text-white"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
                )}
              >
                <span className="truncate">{category.name}</span>
                <span className={cn("text-xs", active ? "text-white/70" : "text-neutral-400")}>
                  {category.productCount}
                </span>
              </Link>
              {active && category.children.length > 0 ? (
                <ul className="mt-1 ml-3 space-y-1 border-l border-neutral-200 pl-3">
                  {category.children.map((child) => (
                    <li key={child.slug}>
                      <Link
                        href={`/marketplace?category=${child.slug}`}
                        className="hover:text-brand-700 flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-neutral-600"
                      >
                        <span className="truncate">{child.name}</span>
                        <span className="text-neutral-400">{child.productCount}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
