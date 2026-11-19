import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { ReportActions } from "@/components/admin/report-actions";
import { PERMISSION, requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Reports" };

export default async function AdminReportsPage() {
  await requirePermission(PERMISSION.REPORT_REVIEW);
  const reports = await prisma.report.findMany({
    where: { status: { in: ["OPEN", "IN_REVIEW"] } },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      targetType: true,
      targetId: true,
      reason: true,
      details: true,
      status: true,
      createdAt: true,
      reporter: { select: { fullName: true, email: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Reports"
        description="Community reports that need a moderation decision."
      />
      <div className="mt-4">
        <AdminNav />
      </div>

      {reports.length === 0 ? (
        <Card className="mt-6 p-8 text-center text-sm text-neutral-600">
          No open reports. The queue is clear.
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {reports.map((report) => (
            <Card key={report.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="muted">{report.targetType}</Badge>
                    <Badge variant="warning">{report.reason.replaceAll("_", " ")}</Badge>
                    <Badge variant="default">{report.status.replaceAll("_", " ")}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-neutral-700">{report.details}</p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Reported by {report.reporter.fullName} · {report.reporter.email} ·{" "}
                    {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(
                      report.createdAt,
                    )}
                  </p>
                </div>
                <ReportActions reportId={report.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
