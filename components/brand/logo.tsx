import Link from "next/link";
import { cn } from "@/lib/utils";

export function JumartMark({
  className,
  variant = "gradient",
}: {
  className?: string;
  variant?: "gradient" | "light" | "flat";
}) {
  const bagFill =
    variant === "light"
      ? "url(#jumartMarkBagLight)"
      : variant === "flat"
        ? "#3B087D"
        : "url(#jumartMarkBag)";

  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-9 w-9 shrink-0", className)}
      role="img"
      aria-label="JUMART"
    >
      <defs>
        <linearGradient id="jumartMarkBag" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#6B21D9" />
          <stop offset="55%" stop-color="#4C0BA8" />
          <stop offset="100%" stop-color="#3B087D" />
        </linearGradient>
        <linearGradient id="jumartMarkBagLight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#8B5CF6" />
          <stop offset="55%" stop-color="#6B21D9" />
          <stop offset="100%" stop-color="#4C0BA8" />
        </linearGradient>
      </defs>
      <path
        d="M20 22h24a4 4 0 0 1 4 4.2l-1.7 17.4A6 6 0 0 1 40.3 49H23.7a6 6 0 0 1-6-5.4L16 26.2A4 4 0 0 1 20 22Z"
        fill={bagFill}
      />
      <path
        d="M25 22c0-6 3.1-10 7-10s7 4 7 10"
        fill="none"
        stroke="#FF9200"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M38 27c-2.6 0-4.6 1.9-4.6 4.2v5.4c0 3.6-2.3 6-5.4 6-2.4 0-4.3-1.5-4.7-3.6"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4.4"
        strokeLinecap="round"
      />
      <g stroke="#FF9200" strokeWidth="3" strokeLinecap="round">
        <path d="M9 30h10" />
        <path d="M5 37h12" />
        <path d="M9 44h9" />
      </g>
    </svg>
  );
}

export function JumartWordmark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span
      className={cn(
        "font-display text-xl leading-none font-extrabold tracking-tight italic",
        tone === "light" ? "text-white" : "text-brand-700",
        className,
      )}
    >
      <span>JUM</span>
      <span className="text-accent-500">ART</span>
    </span>
  );
}

export function JumartLogo({
  className,
  tone = "dark",
  showTagline = false,
}: {
  className?: string;
  tone?: "dark" | "light";
  showTagline?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "focus-visible:ring-brand-500 flex items-center gap-2 rounded-md focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
      aria-label="JUMART home"
    >
      <JumartMark />
      <span className="flex flex-col leading-none">
        <JumartWordmark tone={tone} />
        {showTagline ? (
          <span
            className={cn(
              "mt-1 text-[10px] font-medium tracking-wide",
              tone === "light" ? "text-brand-100" : "text-neutral-500",
            )}
          >
            Your Campus. Your Marketplace.
          </span>
        ) : null}
      </span>
    </Link>
  );
}
