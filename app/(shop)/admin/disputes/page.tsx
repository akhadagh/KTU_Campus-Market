import type { Metadata } from "next";
import { Scale } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { DisputeDecisionForm } from "@/components/admin/dispute-decision-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PERMISSION, requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Disputes" };

export default async function AdminDisputesPage() {
  await requirePermission(PERMISSION.REPORT_REVIEW);

  const disputes = await prisma.dispute.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      category: true,
      description: true,
      status: true,
      resolution: true,
      createdAt: true,
      raisedBy: { select: { fullName: true, email: true } },
      order: {
        select: {
          id: true,
          orderNumber: true,
          totalPesewas: true,
          vendorOrders: { select: { vendor: { select: { storeName: true } } } },
        },
      },
      evidence: { select: { id: true, fileUrl: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Disputes"
        description="Buyer disputes on paid orders, with the decision recorded for both sides."
      />
      <div className="mt-4">
        <AdminNav />
      </div>

      {disputes.length === 0 ? (
        <Card className="mt-6 p-8">
          <EmptyState
            icon={Scale}
            title="No disputes"
            description="Disputes raised by buyers appear here for investigation."
          />
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {disputes.map((dispute) => (
            <Card key={dispute.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900">
                      Order {dispute.order.orderNumber}
                    </p>
                    <Badge variant="warning">{dispute.category.replaceAll("_", " ")}</Badge>
                    <Badge variant="muted">{dispute.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    Raised by {dispute.raisedBy?.fullName ?? "buyer"} ·{" "}
                    {dispute.order.vendorOrders
                      .map((vendorOrder) => vendorOrder.vendor.storeName)
                      .join(", ")}
                  </p>
                </div>
              </div>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-neutral-700">
                {dispute.description}
              </p>

              {dispute.evidence.length > 0 ? (
                <ul className="mt-3 space-y-1 text-xs">
                  {dispute.evidence.map((evidence) => (
                    <li key={evidence.id}>
                      <a
                        href={evidence.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-700 hover:underline"
                      >
                        Evidence: {evidence.fileUrl}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : null}

              {dispute.resolution ? (
                <p className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">
                  <span className="font-medium">Resolution:</span> {dispute.resolution}
                </p>
              ) : null}

              <div className="mt-4">
                <DisputeDecisionForm disputeId={dispute.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
