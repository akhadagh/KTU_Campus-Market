import Link from "next/link";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/vendors", label: "Vendors" },
  { href: "/admin/products", label: "Listings" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/messages", label: "Support" },
  { href: "/admin/airtime", label: "Airtime links" },
  { href: "/admin/resources", label: "Learning materials" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/refunds", label: "Refunds" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/students", label: "Students" },
];

export function AdminNav() {
  return (
    <nav
      aria-label="Administration"
      className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3"
    >
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="focus-visible:ring-brand-500/30 rounded-md px-3 py-1.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:outline-none"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
