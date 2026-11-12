import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, BarChart3, Package, Receipt, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireVendor } from "@/lib/auth/rbac";
import { getVendorAnalytics } from "@/lib/analytics";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "Sales analytics" };

export default async function VendorAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const auth = await requireVendor();
  const query = await searchParams;
  const days = [7, 30, 90].includes(Number(query.days)) ? Number(query.days) : 30;
  const analytics = await getVendorAnalytics(auth.vendorId, days);

  const maxDaily = Math.max(1, ...analytics.dailySales.map((day) => day.revenuePesewas));

  const cards = [
    {
      label: "Gross sales",
      value: formatPesewas(analytics.grossSalesPesewas),
      hint: `Last ${days} days, before refunds`,
      icon: TrendingUp,
    },
    {
      label: "Refundable to you",
      value: formatPesewas(analytics.payablePesewas),
      hint: "Gross sales minus completed refunds",
      icon: Wallet,
    },
    {
      label: "Delivery fees collected",
      value: formatPesewas(analytics.deliveryFeesPesewas),
      hint: "Held by the platform, not sales",
      icon: Receipt,
    },
    {
      label: "Stock value",
      value: formatPesewas(analytics.inventory.stockValuePesewas),
      hint: `${analytics.inventory.totalProducts} live listings`,
      icon: Package,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Sales analytics"
        description="Your real sales, stock and order activity. Nothing here is estimated."
        actions={
          <div className="flex gap-2">
            {[7, 30, 90].map((range) => (
              <Link
                key={range}
                href={`/sell/analytics?days=${range}`}
                className={
                  days === range
                    ? "bg-brand-700 rounded-full px-3 py-1.5 text-sm font-semibold text-white"
                    : "rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                }
              >
                {range}d
              </Link>
            ))}
          </div>
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.label}
              className="border-neutral-200/80 p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                  {card.label}
                </p>
                <Icon className="text-brand-600 h-4 w-4" aria-hidden="true" />
              </div>
              <p className="mt-2 text-2xl font-bold text-neutral-900">{card.value}</p>
              <p className="mt-1 text-xs text-neutral-500">{card.hint}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <BarChart3 className="text-brand-600 h-4 w-4" aria-hidden="true" />
            Daily sales
          </h2>
          {analytics.dailySales.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-600">No sales recorded in this period yet.</p>
          ) : (
            <div className="mt-4 flex h-40 items-end gap-1">
              {analytics.dailySales.map((day) => (
                <div
                  key={day.date}
                  className="bg-brand-500/80 flex-1 rounded-t"
                  style={{ height: `${Math.max(4, (day.revenuePesewas / maxDaily) * 100)}%` }}
                  title={`${day.date}: ${formatPesewas(day.revenuePesewas)} across ${day.orders} order(s)`}
                />
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-neutral-500">
            Bars show gross sales per day. Hover a bar for the exact amount.
          </p>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-neutral-900">Order pipeline</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {[
              { label: "New", value: analytics.orderCounts.pending },
              { label: "Accepted", value: analytics.orderCounts.accepted },
              { label: "Preparing", value: analytics.orderCounts.preparing },
              { label: "Ready for pickup", value: analytics.orderCounts.readyForPickup },
              { label: "Out for delivery", value: analytics.orderCounts.outForDelivery },
              { label: "Delivered", value: analytics.orderCounts.delivered },
              { label: "Cancelled", value: analytics.orderCounts.cancelled },
            ].map((row) => (
              <li key={row.label} className="flex items-center justify-between">
                <span className="text-neutral-600">{row.label}</span>
                <Badge variant="muted">{row.value}</Badge>
              </li>
            ))}
          </ul>

          <h2 className="mt-6 text-sm font-semibold text-neutral-900">Inventory alerts</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600">
            <li className="flex items-center justify-between">
              <span>Low stock (≤ 3 left)</span>
              <Badge variant="warning">{analytics.inventory.lowStock}</Badge>
            </li>
            <li className="flex items-center justify-between">
              <span>Out of stock</span>
              <Badge variant="danger">{analytics.inventory.outOfStock}</Badge>
            </li>
          </ul>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Product performance</h2>
        {analytics.productPerformance.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-600">No product activity in this period.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[34rem] text-left text-sm">
              <thead className="text-xs tracking-wide text-neutral-500 uppercase">
                <tr>
                  <th className="py-2 pr-4">Product</th>
                  <th className="py-2 pr-4">Units sold</th>
                  <th className="py-2 pr-4">Revenue</th>
                  <th className="py-2 pr-4">Stock</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {analytics.productPerformance.map((product) => (
                  <tr key={product.id}>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/sell/products/${product.id}/edit`}
                        className="font-medium text-neutral-900 hover:underline"
                      >
                        {product.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-neutral-700">{product.unitsSold}</td>
                    <td className="py-2 pr-4 text-neutral-700">
                      {formatPesewas(product.revenuePesewas)}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={
                          product.stock === 0
                            ? "text-red-600"
                            : product.stock <= 3
                              ? "text-amber-600"
                              : "text-neutral-700"
                        }
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-2">
                      <Badge variant={product.status === "ACTIVE" ? "success" : "muted"}>
                        {product.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {analytics.refundsPesewas > 0 ? (
        <Card className="mt-4 flex items-start gap-3 border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
          <p className="text-sm text-amber-900">
            {formatPesewas(analytics.refundsPesewas)} of completed refunds are deducted from your
            gross sales in this period.
          </p>
        </Card>
      ) : null}
    </div>
  );
}
