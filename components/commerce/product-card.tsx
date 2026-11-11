import Link from "next/link";
import { Package, Star } from "lucide-react";
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
  const isDemo = product.vendorName.toLowerCase().startsWith("sample");

  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-neutral-100">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.imageUrl}
              alt={product.imageAlt ?? product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Package className="h-12 w-12 text-neutral-400" aria-hidden="true" />
          )}
          {isDemo ? (
            <Badge variant="sample" className="absolute top-3 left-3">
              Demo
            </Badge>
          ) : null}
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <Badge variant={conditionVariants[product.condition] ?? "muted"}>
              {conditionLabels[product.condition] ?? product.condition}
            </Badge>
            <span className="truncate text-xs text-neutral-500">{product.categoryName}</span>
          </div>
          <h3 className="group-hover:text-brand-700 line-clamp-2 text-sm leading-5 font-semibold text-neutral-900">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-neutral-900">
              {formatPesewas(product.pricePesewas)}
            </span>
            {product.originalPricePesewas ? (
              <span className="text-xs text-neutral-500 line-through">
                {formatPesewas(product.originalPricePesewas)}
              </span>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
            <span className="truncate">{product.vendorName}</span>
            <span className="flex shrink-0 items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              {product.ratingCount > 0
                ? `${product.ratingAvg.toFixed(1)} (${product.ratingCount})`
                : "No reviews"}
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
