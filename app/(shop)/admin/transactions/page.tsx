import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PERMISSION, requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "Transactions" };

const statusVariant: Record<string, "success" | "warning" | "muted" | "danger"> = {
  SUCCEEDED: "success",
  PENDING: "warning",
  INITIATED: "warning",
  FAILED: "danger",
  REFUNDED: "muted",
  PARTIALLY_REFUNDED: "warning",
  CANCELLED: "muted",
};

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requirePermission(PERMISSION.ORDER_MANAGE);
  const query = await searchParams;
  const status = query.status ?? "";
  const search = query.q?.trim() ?? "";

  const payments = await prisma.payment.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(search
        ? {
            OR: [
              { providerReference: { contains: search, mode: "insensitive" } },
              { order: { orderNumber: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      provider: true,
      providerReference: true,
      amountPesewas: true,
      currency: true,
      status: true,
      channel: true,
      paidAt: true,
      createdAt: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          status: true,
          buyer: { select: { fullName: true, email: true } },
        },
      },
      refunds: { select: { id: true, amountPesewas: true, status: true } },
    },
  });

  const succeeded = payments.filter((payment) => payment.status === "SUCCEEDED");
  const failed = payments.filter((payment) => payment.status === "FAILED");
  const volume = succeeded.reduce((total, payment) => total + payment.amountPesewas, 0);

  return (
    <div>
      <PageHeader
        title="Transactions"
        description="Every payment recorded against an order, with its provider reference."
      />

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Transactions listed", value: String(payments.length) },
          { label: "Successful", value: String(succeeded.length) },
          { label: "Failed", value: String(failed.length) },
          { label: "Successful volume", value: formatPesewas(volume) },
        ].map((card) => (
          <Card key={card.label} className="border-neutral-200/80 p-5">
            <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
              {card.label}
            </p>
            <p className="mt-2 text-xl font-bold text-neutral-900">{card.value}</p>
          </Card>
        ))}
      </div>

      <form action="/admin/transactions" method="get" className="mt-6 flex max-w-xl gap-2">
        <label htmlFor="transaction-search" className="sr-only">
          Search transactions
        </label>
        <input
          id="transaction-search"
          name="q"
          defaultValue={search}
          placeholder="Order number or provider reference"
          className="focus-visible:border-brand-500 h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
        />
        <select
          name="status"
          defaultValue={status}
          aria-label="Payment status"
          className="focus-visible:border-brand-500 h-10 rounded-lg border border-neutral-300 bg-white px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
        >
          <option value="">All statuses</option>
          {["PENDING", "INITIATED", "SUCCEEDED", "FAILED", "REFUNDED", "CANCELLED"].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-brand-700 hover:bg-brand-600 h-10 shrink-0 rounded-lg px-4 text-sm font-semibold text-white"
        >
          Filter
        </button>
      </form>

      {payments.length === 0 ? (
        <Card className="mt-6 p-8">
          <EmptyState
            icon={Receipt}
            title="No transactions match"
            description="Payments appear here as soon as a buyer starts or completes a payment."
          />
        </Card>
      ) : (
        <Card className="mt-6 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="bg-neutral-50 text-xs tracking-wide text-neutral-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Provider reference</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Refunds</th>
                  <th className="px-4 py-3">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {payment.order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{payment.order.buyer.fullName}</td>
                    <td className="px-4 py-3 text-neutral-900">
                      {formatPesewas(payment.amountPesewas)} {payment.currency}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-500">
                      {payment.providerReference}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[payment.status] ?? "muted"}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {payment.refunds.length === 0
                        ? "—"
                        : payment.refunds
                            .map(
                              (refund) => `${formatPesewas(refund.amountPesewas)} ${refund.status}`,
                            )
                            .join(", ")}
                    </td>
                    <td className="px-4 py-3 text-xs text-neutral-500">
                      {new Intl.DateTimeFormat("en-GH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(payment.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
