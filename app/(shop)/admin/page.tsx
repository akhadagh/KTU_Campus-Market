import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { getAuthContext, hasRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminOverviewPage() {
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/admin");
  if (!hasRole(auth, "admin")) redirect("/");

  const [pendingVendors, pendingProducts, openReports, paidOrders, users, gmv] = await Promise.all([
    prisma.vendorProfile.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { status: "PENDING_REVIEW", deletedAt: null } }),
    prisma.report.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } }),
    prisma.order.count({ where: { status: { in: ["PAID", "PARTIALLY_FULFILLED", "FULFILLED"] } } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.order.aggregate({
      where: { status: { in: ["PAID", "PARTIALLY_FULFILLED", "FULFILLED"] } },
      _sum: { totalPesewas: true },
    }),
  ]);

  const cards = [
    { label: "Pending vendor applications", value: pendingVendors, href: "/admin/vendors" },
    { label: "Listings awaiting review", value: pendingProducts, href: "/admin/products" },
    { label: "Open reports", value: openReports, href: "/admin/reports" },
    { label: "Paid orders", value: paidOrders, href: "/admin/orders" },
    { label: "Registered users", value: users, href: "/admin/vendors" },
    {
      label: "Paid order value",
      value: formatPesewas(gmv._sum.totalPesewas ?? 0),
      href: "/admin/orders",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Administration" description="Platform health and moderation queues." />
      <div className="mt-4">
        <AdminNav />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="focus-visible:ring-brand-500/30 rounded-xl focus-visible:ring-2 focus-visible:outline-none"
          >
            <Card className="h-full p-5 transition-colors hover:bg-neutral-50">
              <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                {card.label}
              </p>
              <p className="mt-2 text-2xl font-semibold text-neutral-900">{card.value}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
