import type { Metadata } from "next";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ProductForm } from "@/components/vendor/product-form";
import { requireVendor } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Add product" };

export default async function NewProductPage() {
  await requireVendor();
  const categories = await prisma.category.findMany({
    where: { isActive: true, type: "PRODUCT" },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Add product"
        description="Accurate descriptions and clear photos help buyers trust your listing."
      />
      <Card className="mt-6 p-6">
        <ProductForm categories={categories} />
      </Card>
    </div>
  );
}
