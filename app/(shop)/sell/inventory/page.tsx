import type { Metadata } from "next";
import { AlertTriangle, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StockAdjuster } from "@/components/vendor/stock-adjuster";
import { requireVendor } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = { title: "Inventory" };

export default async function VendorInventoryPage() {
  const auth = await requireVendor();

  const [products, movements] = await Promise.all([
    prisma.product.findMany({
      where: { vendorId: auth.vendorId, deletedAt: null },
      orderBy: [{ quantity: "asc" }, { name: "asc" }],
      take: 200,
      select: {
        id: true,
        name: true,
        slug: true,
        quantity: true,
        pricePesewas: true,
        status: true,
        variants: {
          where: { isActive: true },
          select: { id: true, name: true, stock: true, sku: true },
          orderBy: { name: "asc" },
        },
      },
    }),
    prisma.inventoryReservation.findMany({
      where: { product: { vendorId: auth.vendorId } },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        quantity: true,
        status: true,
        createdAt: true,
        expiresAt: true,
        product: { select: { name: true } },
        order: { select: { orderNumber: true } },
      },
    }),
  ]);

  const lowStock = products.filter((product) => {
    const stock =
      product.variants.length > 0
        ? product.variants.reduce((total, variant) => total + variant.stock, 0)
        : product.quantity;
    return stock <= 3;
  });

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Live stock levels across your listings, with a record of every stock movement."
      />

      {lowStock.length > 0 ? (
        <Card className="mt-5 border-amber-200 bg-amber-50 p-4">
          <p className="flex items-start gap-2 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {lowStock.length} listing{lowStock.length === 1 ? " is" : "s are"} low on stock. Top them
            up so students can still order.
          </p>
        </Card>
      ) : null}

      <Card className="mt-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="bg-neutral-50 text-xs tracking-wide text-neutral-500 uppercase">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Variants</th>
                <th className="px-4 py-3">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-600">
                    <Package className="mx-auto mb-2 h-6 w-6 text-neutral-300" aria-hidden="true" />
                    You have no listings yet.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const totalStock =
                    product.variants.length > 0
                      ? product.variants.reduce((total, variant) => total + variant.stock, 0)
                      : product.quantity;
                  return (
                    <tr key={product.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-neutral-900">{product.name}</p>
                        <Badge variant={product.status === "ACTIVE" ? "success" : "muted"}>
                          {product.status.replaceAll("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-neutral-700">
                        {formatPesewas(product.pricePesewas)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            totalStock === 0
                              ? "text-red-600"
                              : totalStock <= 3
                                ? "text-amber-600"
                                : "text-neutral-700"
                          }
                        >
                          {totalStock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-600">
                        {product.variants.length === 0 ? (
                          "—"
                        ) : (
                          <ul className="space-y-0.5">
                            {product.variants.map((variant) => (
                              <li key={variant.id}>
                                {variant.name}: {variant.stock}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <StockAdjuster
                          productId={product.id}
                          currentStock={totalStock}
                          hasVariants={product.variants.length > 0}
                          variants={product.variants.map((variant) => ({
                            id: variant.id,
                            name: variant.name,
                            stock: variant.stock,
                          }))}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <h2 className="mt-8 text-sm font-semibold text-neutral-900">Stock movements</h2>
      {movements.length === 0 ? (
        <p className="mt-2 text-sm text-neutral-600">
          Stock movements appear here as orders reserve and consume stock.
        </p>
      ) : (
        <Card className="mt-3 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="bg-neutral-50 text-xs tracking-wide text-neutral-500 uppercase">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="px-4 py-3 text-neutral-600">
                      {new Intl.DateTimeFormat("en-GH", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(movement.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-neutral-900">{movement.product.name}</td>
                    <td className="px-4 py-3 text-neutral-600">{movement.order.orderNumber}</td>
                    <td className="px-4 py-3 text-neutral-700">{movement.quantity}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          movement.status === "CONSUMED"
                            ? "success"
                            : movement.status === "HELD"
                              ? "warning"
                              : "muted"
                        }
                      >
                        {movement.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
