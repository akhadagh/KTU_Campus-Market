import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PackageSearch } from "lucide-react";
import { PayOrderButton } from "@/components/commerce/pay-order-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { orderStatusLabels, statusBadgeVariant, vendorOrderStatusLabels } from "@/lib/labels";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "My orders" };

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(date);

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string; payment?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/orders");
  const query = await searchParams;

  const orders = await prisma.order.findMany({
    where: { buyerId: session.user.id, deletedAt: null },
    orderBy: { placedAt: "desc" },
    take: 50,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalPesewas: true,
      placedAt: true,
      deliveryMethod: true,
      vendorOrders: {
        select: {
          id: true,
          status: true,
          vendor: { select: { storeName: true, slug: true } },
          _count: { select: { items: true } },
        },
      },
      payments: {
        select: { id: true, status: true, provider: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="My orders"
        description="Track payments and fulfilment for every order you place."
      />

      {query.paid === "1" ? (
        <Card className="mt-4 border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Payment confirmed. Your order is now with the seller.
        </Card>
      ) : null}
      {query.payment === "unavailable" ? (
        <Card className="mt-4 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Online payments are not configured on this deployment, so payment could not be completed.
        </Card>
      ) : null}
      {query.payment === "failed" || query.payment === "unverified" ? (
        <Card className="mt-4 border-red-200 bg-red-50 p-4 text-sm text-red-800">
          The payment was not confirmed. You can retry from the order below.
        </Card>
      ) : null}

      {orders.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={PackageSearch}
            title="No orders yet"
            description="When you buy something, the order and its status appear here."
            action={
              <Link href="/marketplace" className={buttonVariants()}>
                Browse marketplace
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {orders.map((order) => (
            <Card key={order.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-base font-semibold text-neutral-900 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <Badge variant={statusBadgeVariant(order.status)}>
                      {orderStatusLabels[order.status] ?? order.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {formatDate(order.placedAt)} ·{" "}
                    {order.deliveryMethod.replaceAll("_", " ").toLowerCase()}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {order.vendorOrders.map((vendorOrder) => (
                      <li key={vendorOrder.id}>
                        <Link
                          href={`/stores/${vendorOrder.vendor.slug}`}
                          className="text-xs text-neutral-600 hover:underline"
                        >
                          {vendorOrder.vendor.storeName} ·{" "}
                          {vendorOrderStatusLabels[vendorOrder.status] ?? vendorOrder.status}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="text-right">
                  <p className="text-base font-semibold text-neutral-900">
                    {formatPesewas(order.totalPesewas)}
                  </p>
                  {order.status === "PENDING_PAYMENT" ? (
                    <div className="mt-2 flex justify-end">
                      <PayOrderButton orderId={order.id} />
                    </div>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
