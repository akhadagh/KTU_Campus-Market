import type { Metadata } from "next";
import Link from "next/link";
import { PackagePlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProductActions } from "@/components/vendor/product-actions";
import { requireVendor } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { productStatusLabels, statusBadgeVariant } from "@/lib/labels";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "My products" };

export default async function VendorProductsPage() {
  const auth = await requireVendor();
  const products = await prisma.product.findMany({
    where: { vendorId: auth.vendorId, deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      slug: true,
      pricePesewas: true,
      quantity: true,
      status: true,
      updatedAt: true,
      images: { select: { url: true, altText: true }, orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="My products"
        description="Drafts stay private. Submitted products become visible after administrator review."
        actions={
          <Link href="/sell/products/new" className={buttonVariants()}>
            <PackagePlus className="h-4 w-4" aria-hidden="true" />
            Add product
          </Link>
        }
      />

      {products.length === 0 ? (
        <Card className="mt-6 p-8 text-center">
          <p className="text-sm font-medium text-neutral-900">No products yet</p>
          <p className="mt-1 text-sm text-neutral-600">
            Add your first listing. You can save it as a draft and submit it later.
          </p>
          <div className="mt-4 flex justify-center">
            <Link href="/sell/products/new" className={buttonVariants()}>
              Add product
            </Link>
          </div>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {products.map((product) => (
            <Card key={product.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
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
                  <p className="truncate text-sm font-semibold text-neutral-900">{product.name}</p>
                  <Badge variant={statusBadgeVariant(product.status)}>
                    {productStatusLabels[product.status] ?? product.status}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-neutral-600">
                  {formatPesewas(product.pricePesewas)} · {product.quantity} in stock
                </p>
              </div>
              <ProductActions id={product.id} status={product.status} />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
