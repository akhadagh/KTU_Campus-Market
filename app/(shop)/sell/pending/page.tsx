import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { statusBadgeVariant, vendorStatusLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "Vendor application status" };

const detailCopy: Record<string, string> = {
  PENDING: "Administrators usually review applications within a day. You will be notified here.",
  PAUSED: "Your store is paused. Contact support if you did not request this.",
  SUSPENDED: "Your store is suspended. Contact support to resolve the issue.",
  CLOSED: "Your application was not approved. You can update your details and apply again.",
};

export default async function VendorPendingPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/sell/pending");

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: {
      storeName: true,
      slug: true,
      status: true,
      verificationStatus: true,
      description: true,
      createdAt: true,
    },
  });
  if (!vendor) redirect("/sell/apply");
  if (vendor.status === "ACTIVE") redirect("/sell/dashboard");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Application status" description="Where your store stands right now." />
      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-lg font-semibold text-neutral-900">{vendor.storeName}</p>
          <Badge variant={statusBadgeVariant(vendor.status)}>
            {vendorStatusLabels[vendor.status] ?? vendor.status}
          </Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-neutral-600">
          {detailCopy[vendor.status] ?? "Your application is being processed."}
        </p>
        {vendor.description ? (
          <div className="mt-5 rounded-lg bg-neutral-50 p-4 text-sm leading-6 text-neutral-700">
            {vendor.description}
          </div>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          {vendor.status === "CLOSED" && vendor.verificationStatus === "REJECTED" ? (
            <Link href="/sell/apply" className={buttonVariants()}>
              Apply again
            </Link>
          ) : null}
          <Link href="/account" className={buttonVariants({ variant: "outline" })}>
            Back to account
          </Link>
        </div>
      </Card>
    </div>
  );
}
