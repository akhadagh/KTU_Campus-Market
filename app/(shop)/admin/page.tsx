import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  BadgeCheck,
  CircleDollarSign,
  Flag,
  LifeBuoy,
  Package,
  Receipt,
  Scale,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getAuthContext, hasRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "Administration" };

export default async function AdminOverviewPage() {
  const auth = await getAuthContext();
  const isAdmin = hasRole(auth, "admin");

  const [
    customers,
    vendorsTotal,
    vendorsPending,
    vendorsActive,
    vendorsSuspended,
    productsTotal,
    productsPending,
    productsActive,
    ordersTotal,
    paidOrders,
    failedPayments,
    refundsPending,
    disputesOpen,
    reportsOpen,
    supportThreads,
    reviewQueue,
    revenue,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count({
      where: { deletedAt: null, roles: { none: { role: { name: "vendor" } } } },
    }),
    prisma.vendorProfile.count({ where: { deletedAt: null } }),
    prisma.vendorProfile.count({ where: { status: "PENDING" } }),
    prisma.vendorProfile.count({ where: { status: "ACTIVE" } }),
    prisma.vendorProfile.count({ where: { status: { in: ["SUSPENDED", "PAUSED", "CLOSED"] } } }),
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { status: "PENDING_REVIEW", deletedAt: null } }),
    prisma.product.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.order.count({ where: { deletedAt: null } }),
    prisma.order.count({ where: { status: { in: ["PAID", "PARTIALLY_FULFILLED", "FULFILLED"] } } }),
    prisma.payment.count({ where: { status: "FAILED" } }),
    prisma.refund.count({ where: { status: "REQUESTED" } }),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    prisma.report.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } }),
    prisma.conversation.count({ where: { kind: "SUPPORT" } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.payment.aggregate({
      where: { status: "SUCCEEDED" },
      _sum: { amountPesewas: true },
    }),
    prisma.order.findMany({
      where: { deletedAt: null },
      orderBy: { placedAt: "desc" },
      take: 6,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalPesewas: true,
        placedAt: true,
        buyer: { select: { fullName: true } },
      },
    }),
  ]);

  const stats = [
    { label: "Customers", value: String(customers), icon: Users },
    { label: "Vendors", value: String(vendorsTotal), icon: Store },
    { label: "Pending applications", value: String(vendorsPending), icon: BadgeCheck },
    { label: "Active vendors", value: String(vendorsActive), icon: BadgeCheck },
    { label: "Suspended / paused", value: String(vendorsSuspended), icon: AlertTriangle },
    { label: "Listings", value: String(productsTotal), icon: Package },
    { label: "Awaiting moderation", value: String(productsPending), icon: Package },
    { label: "Live listings", value: String(productsActive), icon: BadgeCheck },
    { label: "Orders", value: String(ordersTotal), icon: ShoppingBag },
    { label: "Paid orders", value: String(paidOrders), icon: Receipt },
    { label: "Failed payments", value: String(failedPayments), icon: AlertTriangle },
    { label: "Refund requests", value: String(refundsPending), icon: CircleDollarSign },
    { label: "Open disputes", value: String(disputesOpen), icon: Scale },
    { label: "Open reports", value: String(reportsOpen), icon: Flag },
    { label: "Support threads", value: String(supportThreads), icon: LifeBuoy },
    { label: "Reviews to moderate", value: String(reviewQueue), icon: BadgeCheck },
  ];

  const queues = [
    { label: "Vendor applications", count: vendorsPending, href: "/admin/vendors" },
    { label: "Listings to moderate", count: productsPending, href: "/admin/products" },
    { label: "Refund requests", count: refundsPending, href: "/admin/refunds" },
    { label: "Open disputes", count: disputesOpen, href: "/admin/disputes" },
    { label: "Open reports", count: reportsOpen, href: "/admin/reports" },
    { label: "Reviews to moderate", count: reviewQueue, href: "/admin/reviews" },
  ];

  return (
    <div>
      <PageHeader
        title="Platform overview"
        description="Everything below is calculated from live database records."
      />

      {isAdmin ? (
        <Card className="border-brand-100 bg-brand-50/60 mt-5 p-4">
          <p className="text-brand-900 text-sm">
            Gross payment volume:{" "}
            <span className="font-semibold">{formatPesewas(revenue._sum.amountPesewas ?? 0)}</span>{" "}
            from {paidOrders} paid order(s). Platform fees are recorded in the seller ledger.
          </p>
        </Card>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-neutral-200/80 p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                  {stat.label}
                </p>
                <Icon className="text-brand-600 h-4 w-4" aria-hidden="true" />
              </div>
              <p className="mt-2 text-2xl font-bold text-neutral-900">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-neutral-900">Needs attention</h2>
          <ul className="mt-3 space-y-2">
            {queues.map((queue) => (
              <li key={queue.label} className="flex items-center justify-between gap-3">
                <Link
                  href={queue.href}
                  className="hover:text-brand-700 text-sm text-neutral-700 hover:underline"
                >
                  {queue.label}
                </Link>
                <Badge variant={queue.count > 0 ? "warning" : "muted"}>{queue.count}</Badge>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-neutral-900">Latest orders</h2>
            <Link
              href="/admin/orders"
              className="text-brand-700 text-sm font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-600">No orders have been placed yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-neutral-100">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center gap-3 py-2.5">
                  <Link
                    href={`/admin/orders`}
                    className="text-sm font-medium text-neutral-900 hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                  <span className="text-xs text-neutral-500">{order.buyer.fullName}</span>
                  <span className="ml-auto text-sm font-semibold text-neutral-900">
                    {formatPesewas(order.totalPesewas)}
                  </span>
                  <Badge variant="muted">{order.status.replaceAll("_", " ")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
