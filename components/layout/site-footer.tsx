import Link from "next/link";
import { cacheLife } from "next/cache";
import { ShieldCheck, Sparkles } from "lucide-react";
import { JumartLogo, JumartWordmark } from "@/components/brand/logo";
import { Input } from "@/components/ui/input";

async function getCopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

const footerSections = [
  {
    title: "Shop",
    links: [
      { href: "/marketplace", label: "Explore marketplace" },
      { href: "/categories", label: "Categories" },
      { href: "/airtime", label: "Airtime & data" },
      { href: "/resources", label: "Free past questions" },
      { href: "/wishlist", label: "Wishlist" },
    ],
  },
  {
    title: "Sell",
    links: [
      { href: "/sell", label: "Open a JUMART store" },
      { href: "/sell/apply", label: "Become a vendor" },
      { href: "/help", label: "Seller guide" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Log in" },
      { href: "/register", label: "Create account" },
      { href: "/orders", label: "Orders" },
      { href: "/messages", label: "Messages" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/help", label: "Help centre" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/trust-safety", label: "Trust & safety" },
      { href: "/policies", label: "Marketplace policies" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms & conditions" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/policies", label: "Prohibited items" },
    ],
  },
];

export async function SiteFooter() {
  const year = await getCopyrightYear();

  return (
    <footer className="mt-16 border-t border-neutral-200 bg-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <JumartLogo showTagline />
            <p className="mt-4 max-w-xs text-sm leading-6 text-neutral-600">
              A campus marketplace built for students: buy safely, sell simply, and discover what
              you need right around campus.
            </p>

            <form action="/marketplace" method="get" className="mt-5 max-w-xs">
              <label htmlFor="footer-search" className="sr-only">
                Search JUMART
              </label>
              <div className="flex gap-2">
                <Input
                  id="footer-search"
                  name="q"
                  type="search"
                  placeholder="Search JUMART"
                  className="h-10 rounded-full"
                />
                <button
                  type="submit"
                  className="bg-brand-700 hover:bg-brand-600 h-10 shrink-0 rounded-full px-4 text-sm font-semibold text-white transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-semibold text-neutral-900">{section.title}</h2>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.href}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="hover:text-brand-700 text-sm text-neutral-600 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-neutral-200 pt-6 text-xs text-neutral-500 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <p>© {year} JUMART. Your Campus. Your Marketplace.</p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="text-brand-600 h-3.5 w-3.5" aria-hidden="true" />
              Server-verified payments
            </p>
            <p className="flex items-center gap-1.5">
              <Sparkles className="text-accent-500 h-3.5 w-3.5" aria-hidden="true" />
              Admin-approved vendors
            </p>
          </div>
          <div className="flex items-center gap-2">
            <JumartWordmark className="text-base" />
          </div>
        </div>
      </div>
    </footer>
  );
}
