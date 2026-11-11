import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { VendorReviewButtons } from "@/components/admin/vendor-review-buttons";
import { PERMISSION, requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { statusBadgeVariant, vendorStatusLabels } from "@/lib/labels";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Vendor applications" };

const statuses = ["PENDING", "ACTIVE", "PAUSED", "SUSPENDED", "CLOSED"] as const;

export default async function AdminVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission(PERMISSION.VENDOR_APPROVE);
  const params = await searchParams;
  const status = statuses.includes(params.status as (typeof statuses)[number])
    ? (params.status as (typeof statuses)[number])
    : "PENDING";

  const vendors = await prisma.vendorProfile.findMany({
    where: { status },
    orderBy: { createdAt: "asc" },
    take: 100,
    select: {
      id: true,
      storeName: true,
      slug: true,
      description: true,
      businessCategory: true,
      phone: true,
      whatsapp: true,
      status: true,
      createdAt: true,
      user: { select: { fullName: true, email: true, emailVerifiedAt: true } },
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Vendor applications"
        description="Approve stores before they can publish listings."
      />
      <div className="mt-4">
        <AdminNav />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {statuses.map((item) => (
          <Link
            key={item}
            href={`/admin/vendors?status=${item}`}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium",
              item === status
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
            )}
          >
            {vendorStatusLabels[item] ?? item}
          </Link>
        ))}
      </div>

      {vendors.length === 0 ? (
        <Card className="mt-6 p-8 text-center text-sm text-neutral-600">
          No {vendorStatusLabels[status]?.toLowerCase() ?? status} vendors.
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {vendors.map((vendor) => (
            <Card key={vendor.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-neutral-900">{vendor.storeName}</p>
                    <Badge variant={statusBadgeVariant(vendor.status)}>
                      {vendorStatusLabels[vendor.status]}
                    </Badge>
                    {!vendor.user.emailVerifiedAt ? (
                      <Badge variant="warning">Email unverified</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {vendor.user.fullName} · {vendor.user.email}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {vendor.businessCategory ?? "No category"} · {vendor._count.products} product
                    {vendor._count.products === 1 ? "" : "s"} · applied{" "}
                    {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(
                      vendor.createdAt,
                    )}
                  </p>
                  {vendor.description ? (
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-700">
                      {vendor.description}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs text-neutral-500">
                    {vendor.phone ?? "No phone"} · {vendor.whatsapp ?? "No WhatsApp"}
                  </p>
                </div>
                {vendor.status === "PENDING" ? (
                  <VendorReviewButtons vendorId={vendor.id} />
                ) : (
                  <Link
                    href={`/stores/${vendor.slug}`}
                    className="text-brand-700 text-sm font-medium hover:underline"
                  >
                    View store
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
