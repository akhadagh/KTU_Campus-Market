"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, LayoutGrid, PanelLeftClose, PanelLeftOpen, ShoppingBag, Store } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarCategory {
  name: string;
  slug: string;
  productCount: number;
  children: { name: string; slug: string; productCount: number }[];
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

export function MarketplaceSidebar({
  categories,
  activeSlug,
  stores,
  frequentPairs,
}: {
  categories: SidebarCategory[];
  activeSlug: string;
  stores: SidebarStore[];
  frequentPairs: FrequentPair[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) =>
    href === pathname || (href !== "/" && pathname.startsWith(`${href}/`));
  const allCategoriesActive = activeSlug === "" && pathname === "/marketplace";

  const body = (
    <div className="space-y-6">
      <section>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <LayoutGrid className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Categories
        </p>
        <ul className="space-y-1">
          <li>
            <Link
              href="/marketplace"
              onClick={() => setMobileOpen(false)}
              aria-current={allCategoriesActive ? "page" : undefined}
              className={cn(
                "flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                allCategoriesActive
                  ? "bg-brand-700 text-white"
                  : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
              )}
            >
              All categories
              <span className={cn("text-xs", allCategoriesActive ? "text-white/70" : "text-neutral-400")}>
                {categories.reduce((total, category) => total + category.productCount, 0)}
              </span>
            </Link>
          </li>
          {categories.map((category) => {
            const active = isActive(`/categories/${category.slug}`);
            const isExpanded = expanded === category.slug;
            return (
              <li key={category.slug}>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/marketplace?category=${category.slug}`}
                    onClick={() => setMobileOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex flex-1 items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors",
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
                  {category.children.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setExpanded(isExpanded ? null : category.slug)}
                      aria-expanded={isExpanded}
                      aria-label={isExpanded ? `Collapse ${category.name}` : `Expand ${category.name}`}
                      className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  ) : null}
                </div>
                {isExpanded && category.children.length > 0 ? (
                  <ul className="mt-1 ml-3 space-y-1 border-l border-neutral-200 pl-3">
                    {category.children.map((child) => (
                      <li key={child.slug}>
                        <Link
                          href={`/marketplace?category=${child.slug}`}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs text-neutral-600 hover:text-brand-700"
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
      </section>

      <section>
        <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900">
          <Store className="h-4 w-4 text-brand-600" aria-hidden="true" />
          Stores in the market
        </p>
        {stores.length === 0 ? (
          <p className="px-1 text-xs text-neutral-500">No stores are approved yet.</p>
        ) : (
          <ul className="space-y-1">
            {stores.map((store) => (
              <li key={store.slug}>
                <Link
                  href={`/stores/${store.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-start justify-between gap-2 rounded-xl px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{store.storeName}</span>
                    <span className="block truncate text-xs text-neutral-500">
                      {store.businessCategory ?? "Campus store"}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-neutral-400">{store.productCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {frequentPairs.length > 0 ? (
        <section>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <ShoppingBag className="h-4 w-4 text-accent-500" aria-hidden="true" />
            Frequently bought together
          </p>
          <ul className="space-y-2">
            {frequentPairs.map((pair) => (
              <li
                key={`${pair.a.slug}-${pair.b.slug}`}
                className="rounded-xl border border-neutral-200 p-3"
              >
                <div className="flex items-center gap-2">
                  <Link href={`/products/${pair.a.slug}`} className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-neutral-900">{pair.a.name}</p>
                  </Link>
                  <span className="text-xs text-neutral-400">+</span>
                  <Link href={`/products/${pair.b.slug}`} className="min-w-0 flex-1 text-right">
                    <p className="truncate text-xs font-medium text-neutral-900">{pair.b.name}</p>
                  </Link>
                </div>
                <p className="mt-1 text-[11px] text-neutral-500">
                  Bought together in {pair.orders} order{pair.orders === 1 ? "" : "s"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="focus-visible:ring-brand-500/30 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:outline-none"
      >
        {open ? (
          <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
        ) : (
          <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
        )}
        {open ? "Hide categories" : "Show categories"}
      </button>

      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="focus-visible:ring-brand-500/30 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:outline-none lg:hidden"
      >
        <PanelLeftOpen className="h-4 w-4" aria-hidden="true" />
        Browse
      </button>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-brand-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <div
        className={cn(
          "transition-all duration-300",
          open ? "lg:w-72" : "lg:w-14",
        )}
      >
        <div className="hidden lg:block">
          <div
            className={cn(
              "overflow-hidden rounded-2xl border border-neutral-200 bg-white p-4 shadow-[var(--shadow-card)] transition-all",
              open ? "opacity-100" : "h-auto opacity-0 p-2",
            )}
            aria-hidden={!open}
          >
            {open ? (
              body
            ) : (
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Expand categories"
                className="grid h-9 w-9 place-items-center rounded-lg text-neutral-600 hover:bg-neutral-100"
              >
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[84%] max-w-xs transform bg-white p-4 shadow-2xl transition-transform duration-300 lg:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
          aria-label="Marketplace navigation"
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-bold text-neutral-900">Browse</p>
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="grid h-9 w-9 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100"
            >
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="max-h-[calc(100vh-5rem)] overflow-y-auto">{body}</div>
        </div>
      </div>
    </>
  );
}
