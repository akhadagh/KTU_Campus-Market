"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

export function CartBadge({ className }: { className?: string }) {
  const pathname = usePathname();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/v1/cart", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { data?: { itemCount?: number } };
        if (active) setCount(json.data?.itemCount ?? 0);
      } catch {
        // The badge is decorative; a failed count must never break the header.
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [pathname]);

  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart"}
      className={cn(
        "hover:bg-brand-50 hover:text-brand-700 relative grid h-10 w-10 place-items-center rounded-xl text-neutral-600 transition-colors",
        className,
      )}
    >
      <ShoppingCart className="h-5 w-5" aria-hidden="true" />
      {count > 0 ? (
        <span className="bg-accent-500 absolute top-0.5 right-0.5 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold text-white ring-2 ring-white">
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
