import type { Metadata } from "next";
import { Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireVendor } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { platformFee } from "@/lib/orders";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "Payouts & ledger" };

export default async function VendorPayoutsPage() {
  const auth = await requireVendor();

  const [ledger, payouts, refunds] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: { vendorId: auth.vendorId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        type: true,
        grossPesewas: true,
        feePesewas: true,
        netPesewas: true,
        status: true,
        createdAt: true,
        vendorOrder: { select: { order: { select: { orderNumber: true } } } },
      },
    }),
    prisma.payout.findMany({
      where: { vendorId: auth.vendorId },
      orderBy: { periodEnd: "desc" },
      take: 50,
      select: {
        id: true,
        periodStart: true,
        periodEnd: true,
        amountPesewas: true,
        status: true,
        processedAt: true,
      },
    }),
    prisma.refund.findMany({
      where: {
        status: "COMPLETED",
        payment: { order: { vendorOrders: { some: { vendorId: auth.vendorId } } } },
      },
      select: { id: true, amountPesewas: true, createdAt: true },
    }),
  ]);

  const gross = ledger.reduce((total, entry) => total + entry.grossPesewas, 0);
  const fees = ledger.reduce((total, entry) => total + entry.feePesewas, 0);
  const net = ledger.reduce((total, entry) => total + entry.netPesewas, 0);
  const refunded = refunds.reduce((total, refund) => total + refund.amountPesewas, 0);

  return (
    <div>
      <PageHeader
        title="Payouts & ledger"
        description="What you have earned, what the platform has deducted, and what has already been settled."
      />

      <Card className="border-brand-100 bg-brand-50/60 mt-5 p-4">
        <p className="text-brand-900 text-sm">
          Settlement is manual. JUMART does not transfer money automatically; amounts marked
          &ldquo;available&rdquo; are released to you by the platform team after the delivery window
          closes. Refunds are deducted from gross sales.
        </p>
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Gross sales", value: formatPesewas(gross) },
          { label: "Platform fees", value: formatPesewas(fees) },
          { label: "Net earnings", value: formatPesewas(net) },
          { label: "Refunded to buyers", value: formatPesewas(refunded) },
        ].map((card) => (
          <Card key={card.label} className="border-neutral-200/80 p-5">
            <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
              {card.label}
            </p>
            <p className="mt-2 text-xl font-bold text-neutral-900">{card.value}</p>
          </Card>
        ))}
      </div>

      <h2 className="mt-8 text-sm font-semibold text-neutral-900">Earnings ledger</h2>
      {ledger.length === 0 ? (
        <Card className="mt-3 p-8">
          <EmptyState
            icon={Wallet}
            title="No earnings recorded yet"
            description="An entry is created when an order you fulfilled is marked delivered."
          />
        </Card>
      ) : (
        <Card className="mt-3 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-neutral-50 text-xs tracking-wide text-neutral-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Gross</th>
                  <th className="px-4 py-3">Fee</th>
                  <th className="px-4 py-3">Net</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {ledger.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 text-neutral-600">
                      {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(
                        entry.createdAt,
                      )}
                    </td>
                    <td className="px-4 py-3 text-neutral-900">
                      {entry.vendorOrder?.order.orderNumber ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{entry.type}</td>
                    <td className="px-4 py-3 text-neutral-700">
                      {formatPesewas(entry.grossPesewas)}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatPesewas(entry.feePesewas)}
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {formatPesewas(entry.netPesewas)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={entry.status === "AVAILABLE" ? "success" : "muted"}>
                        {entry.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <h2 className="mt-8 text-sm font-semibold text-neutral-900">Settled payouts</h2>
      {payouts.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-600">
          No payouts have been released yet. The platform team settles earnings manually.
        </p>
      ) : (
        <div className="mt-3 space-y-2">
          {payouts.map((payout) => (
            <Card key={payout.id} className="flex flex-wrap items-center gap-3 p-4">
              <p className="text-sm font-semibold text-neutral-900">
                {formatPesewas(payout.amountPesewas)}
              </p>
              <Badge variant={payout.status === "COMPLETED" ? "success" : "warning"}>
                {payout.status}
              </Badge>
              <p className="text-xs text-neutral-500">
                {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(
                  payout.periodStart,
                )}{" "}
                –{" "}
                {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(payout.periodEnd)}
              </p>
            </Card>
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-neutral-500">
        Platform commission is {Math.round((platformFee(10000) / 10000) * 100)}% of each completed
        sale. Gross sales never include delivery fees, which are collected by the platform.
      </p>
    </div>
  );
}
