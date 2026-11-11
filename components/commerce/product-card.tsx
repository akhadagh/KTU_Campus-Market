import Link from "next/link";
import { ImageOff, Package, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { MarketplaceProduct } from "@/lib/marketplace";
import { formatPesewas } from "@/lib/money";

const conditionVariants: Record<string, "success" | "warning" | "muted" | "danger"> = {
  NEW: "success",
  LIKE_NEW: "success",
  REFURBISHED: "warning",
  USED_GOOD: "muted",
  USED_FAIR: "muted",
  NOT_SPECIFIED: "muted",
};

const conditionLabels: Record<string, string> = {
  NEW: "New",
  LIKE_NEW: "Like new",
  REFURBISHED: "Refurbished",
  USED_GOOD: "Used — good",
  USED_FAIR: "Used — fair",
  NOT_SPECIFIED: "Condition not stated",
};

export function ProductCard({ product }: { product: MarketplaceProduct }) {
  const isDigital = product.deliveryOptions.includes("DIGITAL");

  return (
    <Card className="group hover:border-brand-200 overflow-hidden border-neutral-200/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <ImageOff className="h-8 w-8 text-neutral-300" aria-hidden="true" />
            </div>
          )}

          <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
            <Badge variant={conditionVariants[product.condition] ?? "muted"} className="shadow-sm">
              {conditionLabels[product.condition] ?? product.condition}
            </Badge>
            {isDigital ? (
              <Badge variant="default" className="bg-white/90 shadow-sm backdrop-blur">
                Instant delivery
              </Badge>
            ) : null}
          </div>
        </div>

        <div className="space-y-2.5 p-4">
          <p className="text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
            {product.categoryName}
          </p>
          <h3 className="group-hover:text-brand-700 line-clamp-2 min-h-10 text-sm leading-5 font-semibold text-neutral-900 transition-colors">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-neutral-900">
              {formatPesewas(product.pricePesewas)}
            </span>
            {product.originalPricePesewas ? (
              <span className="text-xs text-neutral-400 line-through">
                {formatPesewas(product.originalPricePesewas)}
              </span>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-2 border-t border-neutral-100 pt-2.5 text-xs text-neutral-500">
            <span className="truncate font-medium text-neutral-600">{product.vendorName}</span>
            {product.ratingCount > 0 ? (
              <span className="flex shrink-0 items-center gap-1">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                {product.ratingAvg.toFixed(1)} ({product.ratingCount})
              </span>
            ) : (
              <span className="flex shrink-0 items-center gap-1 text-neutral-400">
                <Package className="h-3.5 w-3.5" aria-hidden="true" />
                {product.quantity > 0 ? `${product.quantity} left` : "Sold out"}
              </span>
            )}
          </div>
        </div>
      </Link>
    </Card>
  );
}
