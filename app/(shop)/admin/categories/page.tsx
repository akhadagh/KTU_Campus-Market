import type { Metadata } from "next";
import { CategoryCreateForm } from "@/components/admin/category-create-form";
import { CategoryToggle } from "@/components/admin/category-toggle";
import { AdminNav } from "@/components/admin/admin-nav";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PERMISSION, requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  await requirePermission(PERMISSION.SETTINGS_MANAGE);

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      sortOrder: true,
      isActive: true,
      iconUrl: true,
      _count: { select: { products: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Categories"
        description="Create, reorder and activate the categories students browse."
      />
      <div className="mt-4">
        <AdminNav />
      </div>

      <div className="mt-6">
        <CategoryCreateForm />
      </div>

      <Card className="mt-6 overflow-hidden">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="bg-neutral-50 text-xs tracking-wide text-neutral-500 uppercase">
            <tr>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Products</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {categories.map((category) => (
              <tr key={category.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      {category.iconUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={category.iconUrl}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-900">{category.name}</p>
                      <p className="text-xs text-neutral-500">/{category.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-neutral-600">{category.type}</td>
                <td className="px-4 py-3 text-neutral-600">{category._count.products}</td>
                <td className="px-4 py-3 text-neutral-600">{category.sortOrder}</td>
                <td className="px-4 py-3">
                  <Badge variant={category.isActive ? "success" : "muted"}>
                    {category.isActive ? "Active" : "Hidden"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <CategoryToggle categoryId={category.id} isActive={category.isActive} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
