import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { PERMISSION, requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { orderStatusLabels, statusBadgeVariant } from "@/lib/labels";
import { formatPesewas } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "All orders" };

const statuses = [
  "PENDING_PAYMENT",
  "PAID",
  "PARTIALLY_FULFILLED",
  "FULFILLED",
  "CANCELLED",
] as const;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission(PERMISSION.ORDER_MANAGE);
  const params = await searchParams;
  const status = statuses.includes(params.status as (typeof statuses)[number])
    ? (params.status as (typeof statuses)[number])
    : undefined;

  const orders = await prisma.order.findMany({
    where: { deletedAt: null, ...(status ? { status } : {}) },
    orderBy: { placedAt: "desc" },
    take: 100,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalPesewas: true,
      placedAt: true,
      deliveryMethod: true,
      buyer: { select: { fullName: true, email: true } },
      payments: {
        select: { status: true, provider: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      vendorOrders: {
        select: {
          id: true,
          status: true,
          vendor: { select: { storeName: true } },
          _count: { select: { items: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Orders" description="Every order placed on the platform." />
      <div className="mt-4">
        <AdminNav />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href="/admin/orders"
          className={cn(
            "rounded-full border px-3 py-1 text-sm font-medium",
            !status
              ? "border-brand-700 bg-brand-700 text-white"
              : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
          )}
        >
          All
        </Link>
        {statuses.map((item) => (
          <Link
            key={item}
            href={`/admin/orders?status=${item}`}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium",
              item === status
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
            )}
          >
            {orderStatusLabels[item]}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <Card className="mt-6 p-8 text-center text-sm text-neutral-600">No orders yet.</Card>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-sm font-semibold text-neutral-900 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <Badge variant={statusBadgeVariant(order.status)}>
                      {orderStatusLabels[order.status] ?? order.status}
                    </Badge>
                    {order.payments[0] ? (
                      <Badge variant="muted">
                        {order.payments[0].provider} · {order.payments[0].status}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {order.buyer.fullName} · {order.buyer.email}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {order.vendorOrders
                      .map(
                        (vendorOrder) =>
                          `${vendorOrder.vendor.storeName} (${vendorOrder.status}, ${vendorOrder._count.items} items)`,
                      )
                      .join(" · ")}
                  </p>
                </div>
                <p className="text-sm font-semibold text-neutral-900">
                  {formatPesewas(order.totalPesewas)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
