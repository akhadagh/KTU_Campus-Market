import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { RefundDecisionButtons } from "@/components/admin/refund-decision-buttons";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PERMISSION, requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "Refunds" };

const statusVariant: Record<string, "success" | "warning" | "muted" | "danger"> = {
  REQUESTED: "warning",
  APPROVED: "warning",
  PROCESSING: "warning",
  COMPLETED: "success",
  REJECTED: "danger",
  FAILED: "danger",
};

export default async function AdminRefundsPage() {
  await requirePermission(PERMISSION.ORDER_MANAGE);

  const refunds = await prisma.refund.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      amountPesewas: true,
      reason: true,
      status: true,
      providerReference: true,
      createdAt: true,
      requestedBy: { select: { fullName: true, email: true } },
      payment: {
        select: {
          order: { select: { id: true, orderNumber: true, totalPesewas: true } },
        },
      },
    },
  });

  const pending = refunds.filter((refund) => refund.status === "REQUESTED");
  const history = refunds.filter((refund) => refund.status !== "REQUESTED");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Refund requests"
        description="Approving a refund sends it to the payment provider. Nothing is marked as refunded before the provider confirms it."
      />
      <div className="mt-4">
        <AdminNav />
      </div>

      <h2 className="mt-8 text-lg font-semibold tracking-tight text-neutral-900">
        Awaiting decision ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <Card className="mt-4 p-8">
          <EmptyState
            icon={Receipt}
            title="No refund requests waiting"
            description="Buyer refund requests appear here for review."
          />
        </Card>
      ) : (
        <div className="mt-4 space-y-3">
          {pending.map((refund) => (
            <Card key={refund.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900">
                      {formatPesewas(refund.amountPesewas)}
                    </p>
                    <Badge variant="warning">Requested</Badge>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    Order {refund.payment.order.orderNumber} ·{" "}
                    {refund.requestedBy?.fullName ?? "Buyer"} · {refund.requestedBy?.email ?? ""}
                  </p>
                  {refund.reason ? (
                    <p className="mt-2 max-w-xl text-sm text-neutral-700">{refund.reason}</p>
                  ) : null}
                </div>
                <RefundDecisionButtons refundId={refund.id} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mt-10 text-lg font-semibold tracking-tight text-neutral-900">History</h2>
      {history.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-600">No processed refunds yet.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {history.map((refund) => (
            <Card key={refund.id} className="flex flex-wrap items-center gap-3 p-4">
              <p className="text-sm font-semibold text-neutral-900">
                {formatPesewas(refund.amountPesewas)}
              </p>
              <Badge variant={statusVariant[refund.status] ?? "muted"}>{refund.status}</Badge>
              <p className="text-xs text-neutral-500">Order {refund.payment.order.orderNumber}</p>
              {refund.providerReference ? (
                <p className="text-xs text-neutral-500">Ref {refund.providerReference}</p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
