import Link from "next/link";
import { cacheLife } from "next/cache";
import { Logo } from "@/components/brand/logo";

async function getCopyrightYear() {
  "use cache";
  cacheLife("days");
  return new Date().getFullYear();
}

const footerSections = [
  {
    title: "Marketplace",
    links: [
      { href: "/marketplace", label: "Explore" },
      { href: "/categories", label: "Categories" },
      { href: "/sell", label: "Sell on Campus Market" },
      { href: "/wishlist", label: "Wishlist" },
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
      { href: "/help", label: "Help & support" },
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
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-6 text-neutral-600">
              A campus marketplace built for students: buy safely, sell simply, and discover what
              you need right around campus.
            </p>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-semibold text-neutral-900">{section.title}</h2>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
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

        <div className="mt-10 flex flex-col gap-3 border-t border-neutral-200 pt-6 text-xs text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Campus Market. Built for the KTU community.</p>
          <p>Payments and marketplace features are enabled only when configured.</p>
        </div>
      </div>
    </footer>
  );
}
