import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Package, ShieldCheck, Star, Truck } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getSampleProduct, sampleProducts } from "@/lib/sample-data";
import { formatCedis } from "@/lib/utils";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getSampleProduct(slug);
  return {
    title: product ? product.name : "Product",
    description: product?.description,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getSampleProduct(slug);

  if (!product) notFound();

  const related = sampleProducts
    .filter((item) => item.categorySlug === product.categorySlug && item.slug !== product.slug)
    .slice(0, 4);

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

      <Alert variant="warning" title="Sample listing" className="mb-6">
        This is demonstration data for the product page design. Cart, checkout, and messaging
        actions are enabled in later milestones.
      </Alert>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <div className="relative flex aspect-square items-center justify-center rounded-xl border border-neutral-200 bg-gradient-to-br from-neutral-100 to-neutral-200">
            <Package className="h-20 w-20 text-neutral-400" aria-hidden="true" />
            <Badge variant="sample" className="absolute top-4 left-4">
              Sample
            </Badge>
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((index) => (
              <div
                key={index}
                className="flex aspect-square items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100"
                aria-hidden="true"
              >
                <Package className="h-6 w-6 text-neutral-400" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="muted">{product.condition}</Badge>
            <Badge variant="sample">Sample data</Badge>
            <Badge variant="success">Verified vendor preview</Badge>
          </div>

          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3 flex items-center gap-3 text-sm text-neutral-600">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
              {product.rating.toFixed(1)} ({product.reviewCount} sample reviews)
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {product.campus}
            </span>
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-semibold text-neutral-900">
              {formatCedis(product.pricePesewas)}
            </span>
            {product.originalPricePesewas ? (
              <span className="text-base text-neutral-500 line-through">
                {formatCedis(product.originalPricePesewas)}
              </span>
            ) : null}
          </div>

          <p className="mt-5 text-sm leading-7 text-neutral-700">{product.description}</p>

          <Card className="mt-6 p-4">
            <div className="flex items-start gap-3">
              <div className="bg-brand-50 text-brand-700 grid h-10 w-10 shrink-0 place-items-center rounded-lg">
                <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-neutral-900">{product.vendorName}</p>
                <p className="text-xs text-neutral-600">
                  Sample storefront · {product.campus} · Vendor verification is demonstrated in
                  Milestone 8.
                </p>
              </div>
            </div>
          </Card>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
              <p className="flex items-center gap-2 font-medium text-neutral-900">
                <Truck className="text-brand-700 h-4 w-4" aria-hidden="true" />
                Delivery options
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                Vendor-arranged delivery and campus pickup will be configured per listing.
              </p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-4 text-sm">
              <p className="flex items-center gap-2 font-medium text-neutral-900">
                <MapPin className="text-brand-700 h-4 w-4" aria-hidden="true" />
                Pickup
              </p>
              <p className="mt-1 text-xs text-neutral-600">
                Campus pickup locations are managed by administrators.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-600">
            Purchase actions are intentionally not shown yet. They will be connected to the cart and
            order system in Milestones 5–7, with server-side price and stock validation.
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-neutral-900">
            Related listings
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
