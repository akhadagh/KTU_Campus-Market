import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PackagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireVendor } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { statusBadgeVariant, vendorOrderStatusLabels, vendorStatusLabels } from "@/lib/labels";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "Seller dashboard" };

export default async function VendorDashboardPage() {
  const auth = await requireVendor();
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: auth.vendorId },
    select: { storeName: true, slug: true, status: true, ratingAvg: true, ratingCount: true },
  });
  if (!vendor) redirect("/sell/apply");

  const [productCounts, openOrderCount, delivered, recentOrders] = await Promise.all([
    prisma.product.groupBy({
      by: ["status"],
      where: { vendorId: auth.vendorId, deletedAt: null },
      _count: { _all: true },
    }),
    prisma.vendorOrder.count({
      where: {
        vendorId: auth.vendorId,
        status: {
          in: ["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"],
        },
      },
    }),
    prisma.vendorOrder.aggregate({
      where: { vendorId: auth.vendorId, status: "DELIVERED" },
      _sum: { totalPesewas: true },
      _count: { _all: true },
    }),
    prisma.vendorOrder.findMany({
      where: { vendorId: auth.vendorId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        status: true,
        totalPesewas: true,
        createdAt: true,
        order: { select: { orderNumber: true, buyer: { select: { fullName: true } } } },
        _count: { select: { items: true } },
      },
    }),
  ]);
  const countByStatus = Object.fromEntries(
    productCounts.map((row) => [row.status, row._count._all]),
  ) as Record<string, number>;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Seller dashboard"
        description={`${vendor.storeName} · ${vendorStatusLabels[vendor.status] ?? vendor.status}`}
        actions={
          <Link href="/sell/products/new" className={buttonVariants({ size: "lg" })}>
            <PackagePlus className="h-4 w-4" aria-hidden="true" />
            Add product
          </Link>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active listings", value: countByStatus["ACTIVE"] ?? 0 },
          { label: "Pending review", value: countByStatus["PENDING_REVIEW"] ?? 0 },
          { label: "Open orders", value: openOrderCount },
          {
            label: "Delivered",
            value: `${formatPesewas(delivered._sum.totalPesewas ?? 0)} · ${delivered._count._all}`,
          },
        ].map((stat) => (
          <Card key={stat.label} className="p-5">
            <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-neutral-900">{stat.value}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-neutral-900">Manage</h2>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/sell/products" className={buttonVariants({ variant: "outline" })}>
              Products and drafts
            </Link>
            <Link href="/sell/orders" className={buttonVariants({ variant: "outline" })}>
              Vendor orders
            </Link>
            <Link
              href={`/stores/${vendor.slug}`}
              className={buttonVariants({ variant: "outline" })}
            >
              View public store
            </Link>
            <Link href="/sell" className={buttonVariants({ variant: "ghost" })}>
              Back to seller overview
            </Link>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-neutral-900">Recent orders</h2>
          {recentOrders.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-600">
              No orders yet. Approved products appear in the marketplace and can be purchased.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-neutral-100">
              {recentOrders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {order.order.orderNumber}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {order.order.buyer.fullName} · {order._count.items} item
                      {order._count.items === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusBadgeVariant(order.status)}>
                      {vendorOrderStatusLabels[order.status] ?? order.status}
                    </Badge>
                    <span className="text-sm font-medium text-neutral-900">
                      {formatPesewas(order.totalPesewas)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
