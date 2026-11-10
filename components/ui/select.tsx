import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "focus-visible:border-brand-500 focus-visible:ring-brand-500/20 flex h-11 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:opacity-70 aria-invalid:border-red-500",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
