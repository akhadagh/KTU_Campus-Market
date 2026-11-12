import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BadgeCheck, ShieldCheck } from "lucide-react";
import { StudentVerificationForm } from "@/components/account/student-verification-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Student verification" };

export default async function StudentVerificationPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/verification");

  const [verification, universities, campuses] = await Promise.all([
    prisma.studentVerification.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        method: true,
        institutionEmail: true,
        status: true,
        notes: true,
        createdAt: true,
        reviewedAt: true,
      },
    }),
    prisma.university.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    prisma.campus.findMany({
      where: { isActive: true },
      select: { id: true, name: true, universityId: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const statusCopy: Record<string, string> = {
    PENDING: "Your request is being reviewed by the JUMART team.",
    APPROVED: "Your student account is verified.",
    REJECTED: "Your request was not approved. Please contact support for details.",
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Student verification"
        description="Verify that you study at a partner university. Verified students carry a badge on the marketplace."
      />

      {verification ? (
        <Card className="mt-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="bg-brand-50 text-brand-700 grid h-11 w-11 place-items-center rounded-xl">
                {verification.status === "APPROVED" ? (
                  <BadgeCheck className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">Verification request</p>
                <p className="text-xs text-neutral-500">
                  {verification.method.replaceAll("_", " ").toLowerCase()} ·{" "}
                  {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(
                    verification.createdAt,
                  )}
                </p>
              </div>
            </div>
            <Badge
              variant={
                verification.status === "APPROVED"
                  ? "success"
                  : verification.status === "PENDING"
                    ? "warning"
                    : "danger"
              }
            >
              {verification.status}
            </Badge>
          </div>
          <p className="mt-4 text-sm text-neutral-600">{statusCopy[verification.status]}</p>
          {verification.institutionEmail ? (
            <p className="mt-1 text-sm text-neutral-500">
              Institutional email: {verification.institutionEmail}
            </p>
          ) : null}
          {verification.notes ? (
            <p className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm text-neutral-700">
              {verification.notes}
            </p>
          ) : null}
        </Card>
      ) : null}

      <Card className="mt-6 p-6">
        <h2 className="text-sm font-semibold text-neutral-900">
          {verification?.status === "APPROVED" ? "Update your request" : "Apply for verification"}
        </h2>
        <p className="mt-1 text-sm text-neutral-600">
          We only store what is needed to confirm your student status. No identity documents are
          uploaded to public storage.
        </p>
        <div className="mt-5">
          <StudentVerificationForm
            universities={universities}
            campuses={campuses}
            defaultUniversityId={session.user.universityId ?? ""}
            defaultCampusId={session.user.campusId ?? ""}
          />
        </div>
      </Card>
    </div>
  );
}
