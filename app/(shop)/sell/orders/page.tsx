import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { VendorOrderActions } from "@/components/vendor/vendor-order-actions";
import { requireVendor } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { statusBadgeVariant, vendorOrderStatusLabels } from "@/lib/labels";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "Vendor orders" };

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(date);

export default async function VendorOrdersPage() {
  const auth = await requireVendor();
  const vendorOrders = await prisma.vendorOrder.findMany({
    where: { vendorId: auth.vendorId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      status: true,
      totalPesewas: true,
      fulfillmentType: true,
      createdAt: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          buyer: { select: { fullName: true, phone: true } },
        },
      },
      items: { select: { id: true, titleSnapshot: true, quantity: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Vendor orders"
        description="Accept orders and keep buyers informed as you prepare, deliver, or hand over items."
      />

      {vendorOrders.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Package}
            title="No orders yet"
            description="Orders appear here as soon as a buyer checks out one of your products."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {vendorOrders.map((vendorOrder) => (
            <Card key={vendorOrder.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/orders/${vendorOrder.order.id}`}
                      className="text-sm font-semibold text-neutral-900 hover:underline"
                    >
                      {vendorOrder.order.orderNumber}
                    </Link>
                    <Badge variant={statusBadgeVariant(vendorOrder.status)}>
                      {vendorOrderStatusLabels[vendorOrder.status] ?? vendorOrder.status}
                    </Badge>
                    <Badge variant="muted">{vendorOrder.fulfillmentType}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {vendorOrder.order.buyer.fullName}
                    {vendorOrder.order.buyer.phone
                      ? ` · ${vendorOrder.order.buyer.phone}`
                      : ""} · {formatDate(vendorOrder.createdAt)}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-neutral-700">
                    {vendorOrder.items.map((item) => (
                      <li key={item.id}>
                        {item.titleSnapshot} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <p className="text-sm font-semibold text-neutral-900">
                    {formatPesewas(vendorOrder.totalPesewas)}
                  </p>
                  <VendorOrderActions orderId={vendorOrder.id} status={vendorOrder.status} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
