import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MapPin, Star, Store } from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { sampleProducts } from "@/lib/sample-data";

interface StorePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const products = sampleProducts.filter((product) => product.vendorSlug === slug);
  const name = products[0]?.vendorName;
  return {
    title: name ?? "Store",
    description: name ? `Shop products from ${name} on Campus Market.` : undefined,
  };
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  const products = sampleProducts.filter((product) => product.vendorSlug === slug);

  if (products.length === 0) notFound();

  const vendor = products[0];

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
                  {vendor.vendorName}
                </h1>
                <Badge variant="sample">Sample store</Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-neutral-600">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {vendor.campus}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  {vendor.rating.toFixed(1)} ({vendor.reviewCount} sample reviews)
                </span>
              </div>
            </div>
          </div>
          <p className="max-w-md text-sm leading-6 text-neutral-600">
            A sample storefront preview. Real store profiles, verification badges, and vendor
            analytics are connected in Milestones 4 and 6.
          </p>
        </div>
      </Card>

      <Alert variant="warning" title="Design preview" className="mt-6">
        These products are demonstration data and are not real vendor listings.
      </Alert>

      <h2 className="mt-8 mb-4 text-xl font-semibold tracking-tight text-neutral-900">
        Products from this store
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>
    </div>
  );
}
