import type { Metadata } from "next";
import { Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireVendor } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Deliveries" };

export default async function VendorDeliveriesPage() {
  const auth = await requireVendor();

  const deliveries = await prisma.delivery.findMany({
    where: { vendorOrder: { vendorId: auth.vendorId } },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      status: true,
      courierType: true,
      trackingCode: true,
      deliveredAt: true,
      createdAt: true,
      vendorOrder: {
        select: {
          id: true,
          order: {
            select: {
              id: true,
              orderNumber: true,
              buyer: { select: { fullName: true } },
              deliveryAddressJson: true,
            },
          },
          items: { select: { titleSnapshot: true, quantity: true } },
        },
      },
    },
  });

  return (
    <div>
      <PageHeader
        title="Deliveries"
        description="Every delivery you have dispatched, with its current status and tracking code."
      />

      {deliveries.length === 0 ? (
        <Card className="mt-6 p-8">
          <EmptyState
            icon={Truck}
            title="No deliveries yet"
            description="Set a delivery status from your orders page once you dispatch an order."
            action={
              <a
                href="/sell/orders"
                className="text-brand-700 text-sm font-medium hover:underline"
              >
                Go to orders
              </a>
            }
          />
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {deliveries.map((delivery) => {
            const address = delivery.vendorOrder.order.deliveryAddressJson as
              | { address?: string; phone?: string }
              | null;
            return (
              <Card key={delivery.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-900">
                        {delivery.vendorOrder.order.orderNumber}
                      </p>
                      <Badge
                        variant={
                          delivery.status === "DELIVERED"
                            ? "success"
                            : delivery.status === "FAILED" || delivery.status === "CANCELLED"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {delivery.status.replaceAll("_", " ")}
                      </Badge>
                      <Badge variant="muted">{delivery.courierType.replaceAll("_", " ")}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {delivery.vendorOrder.order.buyer.fullName}
                      {address?.phone ? ` · ${address.phone}` : ""}
                    </p>
                    {address?.address ? (
                      <p className="mt-1 text-sm text-neutral-600">{address.address}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-neutral-500">
                      {delivery.vendorOrder.items
                        .map((item) => `${item.titleSnapshot} × ${item.quantity}`)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="text-right text-xs text-neutral-500">
                    {delivery.trackingCode ? (
                      <p className="font-medium text-neutral-800">
                        Tracking: {delivery.trackingCode}
                      </p>
                    ) : null}
                    <p className="mt-1">
                      Dispatched{" "}
                      {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(
                        delivery.createdAt,
                      )}
                    </p>
                    {delivery.deliveredAt ? (
                      <p className="mt-1">
                        Delivered{" "}
                        {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(
                          delivery.deliveredAt,
                        )}
                      </p>
                    ) : null}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
