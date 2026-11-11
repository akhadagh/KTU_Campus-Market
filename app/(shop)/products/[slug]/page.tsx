import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, ShieldCheck, Star, Truck, Wallet } from "lucide-react";
import { ProductGallery } from "@/components/commerce/product-gallery";
import { PurchasePanel } from "@/components/commerce/purchase-panel";
import { ReportListingButton } from "@/components/commerce/report-listing-button";
import { AddToWishlistButton } from "@/components/commerce/add-to-wishlist-button";
import { ProductCard } from "@/components/commerce/product-card";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { listMarketplaceProducts, getMarketplaceProduct } from "@/lib/marketplace";
import { conditionLabels, deliveryLabels } from "@/lib/labels";
import { formatPesewas } from "@/lib/money";
import { connection } from "next/server";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null },
    select: { name: true, description: true },
  });
  return {
    title: product?.name ?? "Product",
    description: product?.description?.slice(0, 160) ?? undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  await connection();

  const { slug } = await params;
  const product = await getMarketplaceProduct(slug);
  if (!product) notFound();

  const related = await listMarketplaceProducts({
    categorySlug: product.categorySlug,
    page: 1,
    pageSize: 5,
  });
  const similar = related.items.filter((item) => item.id !== product.id).slice(0, 4);
  const reviews = await prisma.review.findMany({
    where: { productId: product.id, status: "PUBLISHED", deletedAt: null },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      buyer: { select: { fullName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500">
        <ol className="flex flex-wrap items-center gap-2">
          <li>
            <Link href="/marketplace" className="hover:text-neutral-900">
              Marketplace
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/categories/${product.categorySlug}`} className="hover:text-neutral-900">
              {product.categoryName}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-neutral-700">{product.name}</li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <ProductGallery images={product.images} productName={product.name} />

          <ul className="mt-4 grid grid-cols-3 gap-3">
            {[
              { icon: ShieldCheck, label: "Verified seller" },
              { icon: Truck, label: "Campus delivery" },
              { icon: Wallet, label: "Paystack secured" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <li
                  key={item.label}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-2 py-3 text-center text-[11px] font-medium text-neutral-600"
                >
                  <Icon className="text-brand-600 h-4 w-4" aria-hidden="true" />
                  {item.label}
                </li>
              );
            })}
          </ul>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{conditionLabels[product.condition] ?? product.condition}</Badge>
            <Badge variant="default">{product.categoryName}</Badge>
            {product.deliveryOptions.length > 0 ? (
              <Badge variant="success">
                {product.deliveryOptions.length} delivery option
                {product.deliveryOptions.length === 1 ? "" : "s"}
              </Badge>
            ) : null}
            {product.purchaseMode === "EXTERNAL" ? (
              <Badge variant="warning">Sold on the seller&rsquo;s site</Badge>
            ) : null}
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            {product.name}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Listed by {product.vendor.storeName} · {product.categoryName}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              {product.ratingCount > 0
                ? `${product.ratingAvg.toFixed(1)} (${product.ratingCount} review${product.ratingCount === 1 ? "" : "s"})`
                : "No reviews yet"}
            </span>
            {product.campusName ? (
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {product.campusName}
              </span>
            ) : null}
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-bold tracking-tight text-neutral-900">
              {formatPesewas(product.pricePesewas)}
            </span>
            {product.originalPricePesewas ? (
              <span className="text-base text-neutral-500 line-through">
                {formatPesewas(product.originalPricePesewas)}
              </span>
            ) : null}
          </div>

          <p className="mt-5 text-sm leading-7 text-neutral-700">{product.description}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <PurchasePanel
              target={{
                productId: product.id,
                productName: product.name,
                pricePesewas: product.pricePesewas,
                quantity: product.quantity,
                vendorName: product.vendor.storeName,
                purchaseMode: product.purchaseMode,
                externalUrl: product.externalUrl,
                isDigital: product.deliveryOptions.includes("DIGITAL"),
                network: product.digitalDetails?.network ?? null,
                dataAmount: product.digitalDetails?.dataAmount ?? null,
                validity: product.digitalDetails?.validity ?? null,
              }}
            />
            <AddToWishlistButton productId={product.id} productName={product.name} />
          </div>

          <Card className="mt-6 border-neutral-200/80 p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start gap-3">
              <div className="bg-brand-50 text-brand-700 grid h-10 w-10 shrink-0 place-items-center rounded-lg">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  Sold by {product.vendor.storeName}
                </p>
                <p className="mt-1 text-sm leading-6 text-neutral-600">
                  {product.vendor.description ??
                    "This vendor has not added a store description yet."}
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  {product.vendor.pickupAvailable
                    ? "Campus pickup available"
                    : "Pickup not available"}
                  {product.vendor.deliveryAvailable ? " · Delivery available" : ""}
                </p>
                <Link
                  href={`/stores/${product.vendor.slug}`}
                  className="text-brand-700 mt-2 inline-block text-sm font-medium hover:underline"
                >
                  Visit store
                </Link>
              </div>
            </div>
          </Card>

          <div className="mt-4">
            <ReportListingButton
              targetType="PRODUCT"
              targetId={product.id}
              targetName={product.name}
            />
          </div>

          {product.deliveryOptions.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-600">
              {product.deliveryOptions.map((option) => (
                <li
                  key={option}
                  className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-2.5 py-1"
                >
                  <Truck className="h-3 w-3" aria-hidden="true" />
                  {deliveryLabels[option] ?? option}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      {reviews.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900">Reviews</h2>
          <ul className="mt-4 space-y-3">
            {reviews.map((review) => (
              <li key={review.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-neutral-900">{review.buyer.fullName}</p>
                    <span className="flex items-center gap-1 text-sm text-amber-600">
                      <Star
                        className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                        aria-hidden="true"
                      />
                      {review.rating}/5
                    </span>
                  </div>
                  {review.comment ? (
                    <p className="mt-2 text-sm leading-6 text-neutral-700">{review.comment}</p>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {similar.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-neutral-900">
            More in {product.categoryName}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
