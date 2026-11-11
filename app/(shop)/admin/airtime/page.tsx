import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { AdminNav } from "@/components/admin/admin-nav";
import { ExternalReviewButtons } from "@/components/admin/external-review-buttons";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { PERMISSION, requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "Airtime links" };

export default async function AdminAirtimePage() {
  await requirePermission(PERMISSION.PRODUCT_MODERATE);

  const [pending, approved] = await Promise.all([
    prisma.product.findMany({
      where: { purchaseMode: "EXTERNAL", externalStatus: "PENDING", deletedAt: null },
      orderBy: { createdAt: "asc" },
      take: 60,
      select: {
        id: true,
        name: true,
        externalUrl: true,
        pricePesewas: true,
        createdAt: true,
        vendor: { select: { storeName: true, slug: true, user: { select: { email: true } } } },
      },
    }),
    prisma.product.findMany({
      where: { purchaseMode: "EXTERNAL", externalStatus: "APPROVED", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        name: true,
        externalUrl: true,
        externalReviewedAt: true,
        vendor: { select: { storeName: true, slug: true } },
      },
    }),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Airtime & bundle links"
        description="Vendors register their own site or app for airtime and data packages. Approve a link before students can use it."
      />
      <div className="mt-4">
        <AdminNav />
      </div>

      <Card className="border-brand-100 bg-brand-50/60 mt-6 p-4">
        <p className="text-brand-900 flex items-start gap-2 text-sm">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Only approved links appear on the public airtime page. Rejecting a link notifies the
          vendor and keeps it hidden from students.
        </p>
      </Card>

      <h2 className="mt-8 text-lg font-semibold tracking-tight text-neutral-900">
        Awaiting approval
      </h2>
      {pending.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={ExternalLink}
            title="No links waiting"
            description="New vendor links will appear here for review."
          />
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {pending.map((product) => (
            <Card key={product.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900">{product.name}</p>
                    <Badge variant="warning">Awaiting approval</Badge>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {product.vendor.storeName} · {product.vendor.user.email} ·{" "}
                    {formatPesewas(product.pricePesewas)}
                  </p>
                  <a
                    href={product.externalUrl ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-700 mt-2 inline-flex items-center gap-1 text-sm font-medium break-all hover:underline"
                  >
                    {product.externalUrl}
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  </a>
                </div>
                <ExternalReviewButtons productId={product.id} />
              </div>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mt-10 text-lg font-semibold tracking-tight text-neutral-900">
        Approved links
      </h2>
      {approved.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-600">No approved links yet.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {approved.map((product) => (
            <Card key={product.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900">{product.name}</p>
                <p className="text-xs text-neutral-500">
                  {product.vendor.storeName} ·{" "}
                  {product.externalReviewedAt
                    ? `approved ${new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(product.externalReviewedAt)}`
                    : "approved"}
                </p>
              </div>
              <Link
                href={`/stores/${product.vendor.slug}`}
                className="text-brand-700 text-sm font-medium hover:underline"
              >
                View store
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
