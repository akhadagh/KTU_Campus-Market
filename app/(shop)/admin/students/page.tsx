import type { Metadata } from "next";
import { GraduationCap } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { StudentVerificationActions } from "@/components/admin/student-verification-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PERMISSION, requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Student verification" };

export default async function AdminStudentsPage() {
  await requirePermission(PERMISSION.USER_MANAGE);

  const requests = await prisma.studentVerification.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      method: true,
      institutionEmail: true,
      createdAt: true,
      user: {
        select: {
          fullName: true,
          email: true,
          university: { select: { name: true } },
          campus: { select: { name: true } },
        },
      },
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Student verification"
        description="Confirm that a student belongs to the university they selected."
      />
      <div className="mt-4">
        <AdminNav />
      </div>

      {requests.length === 0 ? (
        <Card className="mt-6 p-8">
          <EmptyState
            icon={GraduationCap}
            title="No verification requests"
            description="Requests from the student verification page appear here."
          />
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {requests.map((request) => (
            <Card key={request.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900">
                      {request.user.fullName}
                    </p>
                    <Badge variant="muted">
                      {request.method.replaceAll("_", " ").toLowerCase()}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {request.user.email}
                    {request.institutionEmail ? ` · ${request.institutionEmail}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    {request.user.university?.name ?? "University not selected"}
                    {request.user.campus?.name ? ` · ${request.user.campus.name}` : ""}
                  </p>
                </div>
                <StudentVerificationActions verificationId={request.id} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
