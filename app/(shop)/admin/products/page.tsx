import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { AdminNav } from "@/components/admin/admin-nav";
import { ProductReviewButtons } from "@/components/admin/product-review-buttons";
import { PERMISSION, requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { productStatusLabels, statusBadgeVariant } from "@/lib/labels";
import { formatPesewas } from "@/lib/money";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Listing moderation" };

const statuses = ["PENDING_REVIEW", "ACTIVE", "REJECTED", "ARCHIVED"] as const;

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requirePermission(PERMISSION.PRODUCT_MODERATE);
  const params = await searchParams;
  const status = statuses.includes(params.status as (typeof statuses)[number])
    ? (params.status as (typeof statuses)[number])
    : "PENDING_REVIEW";

  const products = await prisma.product.findMany({
    where: { status, deletedAt: null },
    orderBy: { updatedAt: "asc" },
    take: 100,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      pricePesewas: true,
      quantity: true,
      status: true,
      updatedAt: true,
      category: { select: { name: true } },
      vendor: { select: { storeName: true, slug: true, status: true } },
      images: { select: { url: true, altText: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Listing moderation"
        description="Review submitted listings before they appear in the marketplace."
      />
      <div className="mt-4">
        <AdminNav />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {statuses.map((item) => (
          <Link
            key={item}
            href={`/admin/products?status=${item}`}
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium",
              item === status
                ? "border-brand-700 bg-brand-700 text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50",
            )}
          >
            {productStatusLabels[item] ?? item}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <Card className="mt-6 p-8 text-center text-sm text-neutral-600">
          No {productStatusLabels[status]?.toLowerCase() ?? status} listings.
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {products.map((product) => (
            <Card key={product.id} className="p-5">
              <div className="flex flex-wrap items-start gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {product.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.images[0].url}
                      alt={product.images[0].altText ?? product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-xs text-neutral-400">
                      No photo
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-neutral-900">{product.name}</p>
                    <Badge variant={statusBadgeVariant(product.status)}>
                      {productStatusLabels[product.status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {formatPesewas(product.pricePesewas)} · {product.quantity} in stock ·{" "}
                    {product.category.name}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {product.vendor.storeName} ·{" "}
                    <Link
                      href={`/stores/${product.vendor.slug}`}
                      className="text-brand-700 hover:underline"
                    >
                      store
                    </Link>
                  </p>
                  {product.description ? (
                    <p className="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-neutral-700">
                      {product.description}
                    </p>
                  ) : null}
                </div>
                <ProductReviewButtons productId={product.id} status={product.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
