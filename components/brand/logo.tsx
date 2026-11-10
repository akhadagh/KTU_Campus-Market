import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-brand-900 grid h-9 w-9 place-items-center rounded-lg text-sm font-bold text-white",
        className,
      )}
      aria-hidden="true"
    >
      CM
    </span>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "focus-visible:ring-brand-500 flex items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
      aria-label="Campus Market home"
    >
      <BrandMark />
      <span className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight text-neutral-900">Campus Market</span>
        <span className="mt-0.5 text-[11px] font-medium text-neutral-500">KTU</span>
      </span>
    </Link>
  );
}
