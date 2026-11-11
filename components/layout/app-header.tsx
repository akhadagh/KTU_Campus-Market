"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Heart,
  Menu,
  MessageCircle,
  Search,
  ShoppingCart,
  Sparkles,
  Smartphone,
  Store,
  User,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/marketplace", label: "Explore" },
  { href: "/categories", label: "Categories" },
  { href: "/airtime", label: "Airtime" },
  { href: "/assistant", label: "Ask AI" },
  { href: "/sell", label: "Sell" },
];

const mobileNav = [
  { href: "/marketplace", label: "Explore marketplace" },
  { href: "/categories", label: "Categories" },
  { href: "/airtime", label: "Airtime & data bundles" },
  { href: "/assistant", label: "Ask the campus assistant" },
  { href: "/sell", label: "Sell on Campus Market" },
  { href: "/orders", label: "My orders" },
  { href: "/messages", label: "Messages" },
  { href: "/notifications", label: "Notifications" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/account", label: "My account" },
  { href: "/help", label: "Help & support" },
];

const actionLinks = [
  { href: "/messages", label: "Messages", icon: MessageCircle, desktopOnly: true },
  { href: "/notifications", label: "Notifications", icon: Bell, desktopOnly: true },
  { href: "/wishlist", label: "Wishlist", icon: Heart, desktopOnly: false },
  { href: "/cart", label: "Cart", icon: ShoppingCart, desktopOnly: false },
  { href: "/account", label: "Account", icon: User, desktopOnly: true },
];

const quickLinks = [
  { href: "/airtime", label: "Airtime", icon: Smartphone },
  { href: "/assistant", label: "Ask AI", icon: Sparkles },
  { href: "/sell", label: "Sell", icon: Store },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/85 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Logo className="shrink-0" />
        <span className="bg-brand-50 text-brand-700 hidden rounded-full px-2 py-0.5 text-[11px] font-semibold xl:inline-flex">
          KTU
        </span>

        <form
          action="/marketplace"
          method="get"
          className="hidden min-w-0 flex-1 items-center gap-2 md:flex"
          role="search"
        >
          <label htmlFor="header-search" className="sr-only">
            Search products
          </label>
          <div className="relative w-full max-w-xl rounded-full">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
              aria-hidden="true"
            />
            <Input
              id="header-search"
              name="q"
              type="search"
              placeholder="Search laptops, textbooks, bundles…"
              className="h-10 rounded-full border-neutral-200 bg-neutral-50/70 pl-9 shadow-none transition-colors focus:bg-white"
              autoComplete="off"
            />
          </div>
          <Button type="submit" size="sm" className="sr-only lg:not-sr-only">
            Search
          </Button>
        </form>

        <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900",
                isActive(pathname, item.href) && "bg-brand-50 text-brand-900",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <nav aria-label="Quick links" className="mr-1 hidden items-center gap-1 xl:flex">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "hover:bg-brand-50 hover:text-brand-800 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-neutral-600 transition-colors",
                    isActive(pathname, item.href) && "bg-brand-50 text-brand-800",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {actionLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                title={item.label}
                className={cn(
                  "relative grid h-10 w-10 place-items-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900",
                  item.desktopOnly && "hidden sm:grid",
                  isActive(pathname, item.href) && "bg-brand-50 text-brand-900",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </Link>
            );
          })}

          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex",
            )}
          >
            Log in
          </Link>
          <Link
            href="/register"
            className={cn(buttonVariants({ size: "sm" }), "hidden lg:inline-flex")}
          >
            Get started
          </Link>

          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="grid h-10 w-10 place-items-center rounded-md text-neutral-700 transition-colors hover:bg-neutral-100 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Menu</DialogTitle>
                <DialogDescription>Navigate Campus Market.</DialogDescription>
              </DialogHeader>

              <form action="/marketplace" method="get" role="search" className="mb-4">
                <label htmlFor="mobile-search" className="sr-only">
                  Search products
                </label>
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400"
                    aria-hidden="true"
                  />
                  <Input
                    id="mobile-search"
                    name="q"
                    type="search"
                    placeholder="Search Campus Market"
                    className="pl-9"
                  />
                </div>
              </form>

              <nav aria-label="Mobile" className="flex flex-col">
                {mobileNav.map((item) => (
                  <DialogClose asChild key={item.href}>
                    <Link
                      href={item.href}
                      className="rounded-md px-3 py-3 text-sm font-medium text-neutral-800 hover:bg-neutral-100"
                    >
                      {item.label}
                    </Link>
                  </DialogClose>
                ))}
              </nav>

              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-neutral-200 pt-4">
                <DialogClose asChild>
                  <Link href="/login" className={buttonVariants({ variant: "outline" })}>
                    Log in
                  </Link>
                </DialogClose>
                <DialogClose asChild>
                  <Link href="/register" className={buttonVariants()}>
                    Get started
                  </Link>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
