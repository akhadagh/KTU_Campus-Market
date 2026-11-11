import Link from "next/link";
import { LayoutGrid, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface CategoryCardData {
  name: string;
  slug: string;
  type: "PRODUCT" | "SERVICE";
  productCount: number;
}

export function CategoryCard({ category }: { category: CategoryCardData }) {
  const Icon = category.type === "SERVICE" ? Sparkles : LayoutGrid;
  return (
    <Link href={`/categories/${category.slug}`} className="group block">
      <Card className="group-hover:border-brand-200 group-hover:bg-brand-50/40 h-full p-4 transition-colors">
        <div className="bg-brand-50 text-brand-700 mb-3 grid h-10 w-10 place-items-center rounded-lg">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <h3 className="group-hover:text-brand-700 text-sm font-semibold text-neutral-900">
          {category.name}
        </h3>
        <p className="mt-1 text-xs leading-5 text-neutral-600">
          {category.productCount} listing{category.productCount === 1 ? "" : "s"}
        </p>
      </Card>
    </Link>
  );
}
