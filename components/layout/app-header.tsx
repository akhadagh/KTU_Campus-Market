"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Heart, Menu, MessageCircle, Search, Store, User } from "lucide-react";
import { JumartLogo } from "@/components/brand/logo";
import { CartBadge } from "@/components/commerce/cart-badge";
import { NavDrawer } from "@/components/layout/nav-drawer";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const iconLinks = [
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
];

export function AppHeader() {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="focus-visible:ring-brand-500 hover:bg-brand-50 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-neutral-700 transition-colors focus-visible:ring-2 focus-visible:outline-none"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <JumartLogo className="shrink-0" />

          <form
            action="/marketplace"
            method="get"
            role="search"
            className="hidden min-w-0 flex-1 md:block"
          >
            <label htmlFor="header-search" className="sr-only">
              Search products
            </label>
            <div className="relative w-full max-w-xl">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400"
                aria-hidden="true"
              />
              <Input
                id="header-search"
                name="q"
                type="search"
                placeholder="Search laptops, sandals, past questions, airtime…"
                className="h-11 rounded-full border-neutral-200 bg-neutral-100/70 pl-10 shadow-none transition-colors focus:bg-white"
                autoComplete="off"
              />
            </div>
          </form>

          <div className="ml-auto flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setSearchOpen((value) => !value)}
              aria-label="Search"
              aria-expanded={searchOpen}
              className="focus-visible:ring-brand-500 hover:bg-brand-50 grid h-10 w-10 place-items-center rounded-xl text-neutral-600 transition-colors md:hidden"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </button>

            {iconLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  title={item.label}
                  className={cn(
                    "hover:bg-brand-50 hover:text-brand-700 hidden h-10 w-10 place-items-center rounded-xl text-neutral-600 transition-colors sm:grid",
                    pathname.startsWith(item.href) && "bg-brand-50 text-brand-700",
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </Link>
              );
            })}

            <CartBadge />

            <Link
              href="/account"
              aria-label="Account"
              className={cn(
                "hover:bg-brand-50 hover:text-brand-700 hidden h-10 w-10 place-items-center rounded-xl text-neutral-600 transition-colors lg:grid",
                pathname.startsWith("/account") && "bg-brand-50 text-brand-700",
              )}
            >
              <User className="h-5 w-5" aria-hidden="true" />
            </Link>

            <Link
              href="/sell"
              className={cn(
                buttonVariants({ size: "sm" }),
                "ml-1 hidden shrink-0 rounded-full px-4 sm:inline-flex",
              )}
            >
              <Store className="h-4 w-4" aria-hidden="true" />
              Sell
            </Link>
          </div>
        </div>

        {searchOpen ? (
          <div className="border-t border-neutral-200 px-4 py-3 md:hidden">
            <form action="/marketplace" method="get" role="search">
              <label htmlFor="mobile-search" className="sr-only">
                Search products
              </label>
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-neutral-400"
                  aria-hidden="true"
                />
                <Input
                  id="mobile-search"
                  name="q"
                  type="search"
                  placeholder="Search JUMART"
                  className="h-11 rounded-full pl-10"
                  autoComplete="off"
                />
              </div>
            </form>
          </div>
        ) : null}
      </header>

      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
