import Link from "next/link";
import type { SampleCategory } from "@/lib/sample-data";
import { Card } from "@/components/ui/card";

export function CategoryCard({ category }: { category: SampleCategory }) {
  const Icon = category.icon;
  return (
    <Link href={`/categories/${category.slug}`} className="group block">
      <Card className="group-hover:border-brand-200 group-hover:bg-brand-50/40 h-full p-4 transition-colors">
        <div className="bg-brand-50 text-brand-700 mb-3 grid h-10 w-10 place-items-center rounded-lg">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <h3 className="group-hover:text-brand-700 text-sm font-semibold text-neutral-900">
          {category.name}
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-neutral-600">
          {category.description}
        </p>
      </Card>
    </Link>
  );
}
