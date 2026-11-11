import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Star, Store } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { prisma } from "@/lib/db";
import { listMarketplaceProducts } from "@/lib/marketplace";
import { connection } from "next/server";

interface StorePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await prisma.vendorProfile.findUnique({
    where: { slug },
    select: { storeName: true, description: true },
  });
  return {
    title: vendor?.storeName ?? "Store",
    description: vendor?.description ?? undefined,
  };
}

export default async function StorePage({ params, searchParams }: StorePageProps) {
  await connection();

  const { slug } = await params;
  const query = await searchParams;
  const page = Math.max(1, Number(query.page ?? "1") || 1);

  const vendor = await prisma.vendorProfile.findFirst({
    where: { slug, status: "ACTIVE", deletedAt: null },
    select: {
      id: true,
      storeName: true,
      slug: true,
      description: true,
      businessCategory: true,
      phone: true,
      whatsapp: true,
      ratingAvg: true,
      ratingCount: true,
      pickupAvailable: true,
      deliveryAvailable: true,
      campus: { select: { name: true } },
    },
  });
  if (!vendor) notFound();

  const results = await listMarketplaceProducts({ vendorSlug: slug, page });
  const isDemo = vendor.storeName.toLowerCase().startsWith("sample");

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Card className="overflow-hidden">
        <div className="from-brand-900 to-brand-700 h-28 bg-gradient-to-r" />
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="-mt-14 grid h-20 w-20 shrink-0 place-items-center rounded-xl border-4 border-white bg-neutral-100 text-neutral-500 shadow-sm">
              <Store className="h-8 w-8" aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                  {vendor.storeName}
                </h1>
                {isDemo ? <Badge variant="sample">Demo store</Badge> : null}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-600">
                {vendor.campus?.name ? (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {vendor.campus.name}
                  </span>
                ) : null}
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  {vendor.ratingCount > 0
                    ? `${vendor.ratingAvg.toFixed(1)} (${vendor.ratingCount} review${vendor.ratingCount === 1 ? "" : "s"})`
                    : "No reviews yet"}
                </span>
              </div>
            </div>
          </div>
          <div className="max-w-md text-sm leading-6 text-neutral-600">
            {vendor.description ?? "This vendor has not added a store description yet."}
            <p className="mt-2 text-xs text-neutral-500">
              {vendor.pickupAvailable ? "Campus pickup available" : "Pickup not available"}
              {vendor.deliveryAvailable ? " · Delivery available" : ""}
              {vendor.phone ? ` · ${vendor.phone}` : ""}
            </p>
          </div>
        </div>
      </Card>

      <h2 className="mt-8 mb-4 text-xl font-semibold tracking-tight text-neutral-900">
        Products from this store
      </h2>

      {results.items.length === 0 ? (
        <EmptyState
          icon={Store}
          title="No live listings right now"
          description="This store has no published products at the moment."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {results.items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
