"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BadgeCheck,
  BarChart3,
  Bell,
  BookOpen,
  ClipboardList,
  CreditCard,
  Flag,
  FolderTree,
  Heart,
  History,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessageCircle,
  Package,
  Receipt,
  Scale,
  Settings,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Signal,
  Star,
  Store,
  Tag,
  Truck,
  User,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  orders: ShoppingBag,
  wishlist: Heart,
  messages: MessageCircle,
  notifications: Bell,
  profile: User,
  address: MapPin,
  verification: BadgeCheck,
  requests: LifeBuoy,
  security: ShieldCheck,
  close: LogOut,
  products: Package,
  addProduct: Tag,
  inventory: ClipboardList,
  analytics: BarChart3,
  store: Store,
  payouts: Wallet,
  vendors: Store,
  listings: Package,
  transactions: Receipt,
  refunds: CreditCard,
  disputes: Scale,
  reports: Flag,
  reviews: Star,
  support: MessageCircle,
  airtime: Signal,
  materials: BookOpen,
  students: Users,
  users: Users,
  categories: FolderTree,
  audit: History,
  settings: Settings,
  delivery: Truck,
};

export interface SidebarItem {
  href: string;
  label: string;
  icon: keyof typeof ICONS;
  badge?: number;
}

export function DashboardSidebar({
  title,
  subtitle,
  items,
  accent = "brand",
}: {
  title: string;
  subtitle?: string;
  items: SidebarItem[];
  accent?: "brand" | "accent";
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === pathname || (href !== "/" && pathname.startsWith(`${href}/`));

  const list = (
    <nav aria-label={`${title} navigation`} className="space-y-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon] ?? LayoutDashboard;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${
                    accent === "accent" ? "bg-accent-500 text-white" : "bg-brand-700 text-white"
                  }`
                : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            }
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && item.badge > 0 ? (
              <span
                className={
                  active
                    ? "rounded-full bg-white/25 px-1.5 py-0.5 text-[11px] font-bold"
                    : "bg-accent-500 rounded-full px-1.5 py-0.5 text-[11px] font-bold text-white"
                }
              >
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="focus-visible:ring-brand-500 inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold text-neutral-700 focus-visible:ring-2 focus-visible:outline-none"
          aria-expanded={open}
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
          {title} menu
        </button>
      </div>

      {open ? (
        <div
          className="bg-brand-900/40 fixed inset-0 z-40 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={
          open
            ? "fixed inset-y-0 left-0 z-50 flex w-[84%] max-w-xs flex-col bg-white p-4 shadow-2xl lg:static lg:z-auto lg:w-64 lg:max-w-none lg:shrink-0 lg:rounded-2xl lg:border lg:border-neutral-200 lg:p-4 lg:shadow-none"
            : "fixed inset-y-0 left-0 z-50 hidden w-[84%] max-w-xs -translate-x-full flex-col bg-white p-4 shadow-2xl lg:static lg:z-auto lg:flex lg:w-64 lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:rounded-2xl lg:border lg:border-neutral-200 lg:p-4 lg:shadow-none"
        }
        aria-label={title}
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-neutral-900">{title}</p>
            {subtitle ? <p className="text-xs text-neutral-500">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid h-8 w-8 place-items-center rounded-lg text-neutral-500 hover:bg-neutral-100 lg:hidden"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{list}</div>
      </aside>
    </>
  );
}
