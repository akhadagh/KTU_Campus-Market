"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Heart,
  LayoutGrid,
  LogIn,
  MessageCircle,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  User,
  X,
} from "lucide-react";
import { JumartMark, JumartWordmark } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const shopLinks = [
  { href: "/marketplace", label: "Explore marketplace", icon: ShoppingBag },
  { href: "/categories", label: "Categories", icon: LayoutGrid },
  { href: "/airtime", label: "Airtime & data bundles", icon: Sparkles },
  { href: "/resources", label: "Free past questions", icon: BookOpen },
  { href: "/assistant", label: "Ask the campus assistant", icon: Sparkles },
];

const accountLinks = [
  { href: "/account", label: "My account", icon: User },
  { href: "/orders", label: "My orders", icon: Package },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/notifications", label: "Notifications", icon: MessageCircle },
  { href: "/sell", label: "Sell on JUMART", icon: Store },
];

export function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "bg-brand-900/40 fixed inset-0 z-40 backdrop-blur-sm transition-opacity duration-200",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Site navigation"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <JumartMark className="h-8 w-8" />
            <JumartWordmark />
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="focus-visible:ring-brand-500 grid h-9 w-9 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:outline-none"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-2 pb-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
            Shop
          </p>
          <ul className="space-y-1">
            {shopLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "hover:text-brand-700 text-neutral-700 hover:bg-neutral-50",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          <p className="px-2 pt-5 pb-2 text-xs font-semibold tracking-wide text-neutral-400 uppercase">
            Your account
          </p>
          <ul className="space-y-1">
            {accountLinks.map((link) => {
              const Icon = link.icon;
              const active = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "hover:text-brand-700 text-neutral-700 hover:bg-neutral-50",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-neutral-200 p-4">
          <Link href="/login" onClick={onClose} className={buttonVariants({ variant: "outline" })}>
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Log in
          </Link>
          <Link href="/register" onClick={onClose} className={`${buttonVariants()} mt-2 w-full`}>
            Create an account
          </Link>
          <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-neutral-500">
            <ShieldCheck
              className="text-brand-600 mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            />
            JUMART keeps payments server-verified and vendors admin-approved.
          </p>
        </div>
      </aside>
    </>
  );
}
