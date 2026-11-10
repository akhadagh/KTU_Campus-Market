import Link from "next/link";
import { Package, Star } from "lucide-react";
import type { SampleProduct } from "@/lib/sample-data";
import { formatCedis } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const conditionVariant = {
  New: "success",
  Used: "muted",
  Refurbished: "warning",
} as const;

export function ProductCard({ product }: { product: SampleProduct }) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-neutral-100 to-neutral-200">
          <Package className="h-12 w-12 text-neutral-400" aria-hidden="true" />
          <Badge variant="sample" className="absolute top-3 left-3">
            Sample
          </Badge>
        </div>
        <div className="space-y-2 p-4">
          <div className="flex items-center justify-between gap-2">
            <Badge variant={conditionVariant[product.condition]}>{product.condition}</Badge>
            <span className="text-xs text-neutral-500">{product.categoryName}</span>
          </div>
          <h3 className="group-hover:text-brand-700 line-clamp-2 text-sm leading-5 font-semibold text-neutral-900">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-neutral-900">
              {formatCedis(product.pricePesewas)}
            </span>
            {product.originalPricePesewas ? (
              <span className="text-xs text-neutral-500 line-through">
                {formatCedis(product.originalPricePesewas)}
              </span>
            ) : null}
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
            <span className="truncate">{product.vendorName}</span>
            <span className="flex shrink-0 items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              {product.rating.toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
