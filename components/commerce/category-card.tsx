import Link from "next/link";
import { ImageOff, LayoutGrid, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface CategoryCardData {
  name: string;
  slug: string;
  type: "PRODUCT" | "SERVICE";
  productCount: number;
  iconUrl?: string | null;
}

export function CategoryCard({ category }: { category: CategoryCardData }) {
  const Icon = category.type === "SERVICE" ? Sparkles : LayoutGrid;
  return (
    <Link href={`/categories/${category.slug}`} className="group block">
      <Card className="group-hover:border-brand-200 h-full overflow-hidden border-neutral-200/80 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
        <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
          {category.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={category.iconUrl}
              alt={category.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="grid h-full w-full place-items-center">
              <ImageOff className="h-7 w-7 text-neutral-300" aria-hidden="true" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/70 via-neutral-900/10 to-transparent" />
          <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
            <h3 className="text-sm font-semibold text-white drop-shadow-sm">{category.name}</h3>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-neutral-800">
              <Icon className="h-3 w-3" aria-hidden="true" />
              {category.productCount}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
