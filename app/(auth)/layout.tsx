import type { ReactNode } from "react";
import Link from "next/link";
import { BadgeCheck, ShieldCheck, Store } from "lucide-react";
import { BrandMark } from "@/components/brand/logo";
import { Logo } from "@/components/brand/logo";

const points = [
  { icon: Store, text: "One account to buy and sell on campus." },
  { icon: BadgeCheck, text: "Separate student and vendor verification." },
  { icon: ShieldCheck, text: "Server-verified payments and protected accounts." },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="bg-brand-900 hidden flex-col justify-between p-10 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2" aria-label="Campus Market home">
          <BrandMark />
          <div>
            <p className="text-sm font-semibold">Campus Market</p>
            <p className="text-brand-100 text-xs">KTU</p>
          </div>
        </Link>

        <div className="max-w-md">
          <p className="text-brand-100 text-sm font-medium">
            Everything you need. Right around campus.
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Buy and sell with the campus community.
          </h1>
          <ul className="mt-8 space-y-4">
            {points.map((point) => {
              const Icon = point.icon;
              return (
                <li key={point.text} className="text-brand-50 flex gap-3 text-sm">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" aria-hidden="true" />
                  <span>{point.text}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="text-brand-100 text-xs">
          Payments, verification, and AI features are enabled only when configured.
        </p>
      </aside>

      <div className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
