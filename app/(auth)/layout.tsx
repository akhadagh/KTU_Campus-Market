import type { ReactNode } from "react";
import Link from "next/link";
import { BadgeCheck, ShieldCheck, Store } from "lucide-react";
import { JumartMark, JumartWordmark } from "@/components/brand/logo";

const points = [
  { icon: Store, text: "One account to buy and sell on campus." },
  { icon: BadgeCheck, text: "Separate student and vendor verification." },
  { icon: ShieldCheck, text: "Server-verified payments and protected accounts." },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <a
        href="#main-content"
        className="focus:bg-brand-900 sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:px-4 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <aside
        className="relative hidden flex-col justify-between bg-cover bg-center p-10 text-white lg:flex"
        style={{ backgroundImage: "url(/campus.svg)" }}
      >
        <div
          className="from-brand-900/90 via-brand-900/70 to-accent-700/55 absolute inset-0 bg-gradient-to-br"
          aria-hidden="true"
        />
        <Link href="/" className="relative z-10 flex items-center gap-2" aria-label="JUMART home">
          <JumartMark variant="light" className="h-10 w-10" />
          <div>
            <JumartWordmark tone="light" className="text-2xl" />
            <p className="text-brand-200 mt-1 text-[11px] font-medium">
              Your Campus. Your Marketplace.
            </p>
          </div>
        </Link>

        <div className="relative z-10 max-w-md">
          <p className="text-brand-200 text-sm font-medium">Welcome to JUMART</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            Your Campus. Your Marketplace.
          </p>
          <ul className="mt-8 space-y-4">
            {points.map((point) => {
              const Icon = point.icon;
              return (
                <li key={point.text} className="text-brand-50 flex gap-3 text-sm">
                  <Icon className="text-accent-400 mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{point.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-brand-200 relative z-10 text-xs">
          Payments and verification are enabled only when their providers are configured.
        </p>
      </aside>

      <div className="flex items-center justify-center px-4 py-10 sm:px-6">
        <main id="main-content" className="w-full max-w-md">
          <div
            className="mb-6 h-44 w-full rounded-2xl bg-cover bg-center shadow-[var(--shadow-card)] lg:hidden"
            style={{ backgroundImage: "url(/campus.svg)" }}
            aria-hidden="true"
          />
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2" aria-label="JUMART home">
              <JumartMark className="h-9 w-9" />
              <div>
                <JumartWordmark />
                <p className="mt-0.5 text-[10px] font-medium text-neutral-500">
                  Your Campus. Your Marketplace.
                </p>
              </div>
            </Link>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
