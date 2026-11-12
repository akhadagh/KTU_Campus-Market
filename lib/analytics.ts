import { prisma } from "@/lib/db";

export interface VendorAnalytics {
  periodDays: number;
  grossSalesPesewas: number;
  deliveryFeesPesewas: number;
  refundsPesewas: number;
  payablePesewas: number;
  orderCounts: {
    total: number;
    pending: number;
    accepted: number;
    preparing: number;
    readyForPickup: number;
    outForDelivery: number;
    delivered: number;
    cancelled: number;
  };
  productPerformance: {
    id: string;
    name: string;
    slug: string;
    unitsSold: number;
    revenuePesewas: number;
    stock: number;
    status: string;
  }[];
  inventory: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    stockValuePesewas: number;
  };
  dailySales: { date: string; revenuePesewas: number; orders: number }[];
  topVendors: { name: string; orders: number; revenuePesewas: number }[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

export async function getVendorAnalytics(
  vendorId: string,
  periodDays = 30,
): Promise<VendorAnalytics> {
  const since = new Date(Date.now() - periodDays * DAY_MS);

  const [vendorOrders, products, refunds] = await Promise.all([
    prisma.vendorOrder.findMany({
      where: { vendorId, createdAt: { gte: since } },
      select: {
        id: true,
        status: true,
        subtotalPesewas: true,
        deliveryFeePesewas: true,
        totalPesewas: true,
        createdAt: true,
        items: { select: { productId: true, quantity: true, lineTotalPesewas: true } },
      },
    }),
    prisma.product.findMany({
      where: { vendorId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        quantity: true,
        status: true,
        pricePesewas: true,
        variants: { select: { stock: true } },
      },
    }),
    prisma.refund.findMany({
      where: {
        status: "COMPLETED",
        payment: { order: { vendorOrders: { some: { vendorId } } } },
      },
      select: { amountPesewas: true },
    }),
  ]);

  const grossSalesPesewas = vendorOrders.reduce((total, order) => total + order.subtotalPesewas, 0);
  const deliveryFeesPesewas = vendorOrders.reduce(
    (total, order) => total + order.deliveryFeePesewas,
    0,
  );
  const refundsPesewas = refunds.reduce((total, refund) => total + refund.amountPesewas, 0);

  const countByStatus = (status: string) =>
    vendorOrders.filter((order) => order.status === status).length;

  const productStats = new Map<
    string,
    {
      id: string;
      name: string;
      slug: string;
      unitsSold: number;
      revenuePesewas: number;
      stock: number;
      status: string;
    }
  >();

  for (const product of products) {
    const stock =
      product.variants.length > 0
        ? product.variants.reduce((total, variant) => total + variant.stock, 0)
        : product.quantity;
    productStats.set(product.id, {
      id: product.id,
      name: product.name,
      slug: product.slug,
      unitsSold: 0,
      revenuePesewas: 0,
      stock,
      status: product.status,
    });
  }

  const daily = new Map<string, { revenuePesewas: number; orders: number }>();
  for (const order of vendorOrders) {
    const key = order.createdAt.toISOString().slice(0, 10);
    const entry = daily.get(key) ?? { revenuePesewas: 0, orders: 0 };
    entry.revenuePesewas += order.subtotalPesewas;
    entry.orders += 1;
    daily.set(key, entry);

    for (const item of order.items) {
      if (!item.productId) continue;
      const stats = productStats.get(item.productId);
      if (!stats) continue;
      stats.unitsSold += item.quantity;
      stats.revenuePesewas += item.lineTotalPesewas;
    }
  }

  const productPerformance = [...productStats.values()]
    .filter((product) => product.unitsSold > 0 || product.status === "ACTIVE")
    .sort((a, b) => b.revenuePesewas - a.revenuePesewas)
    .slice(0, 10);

  const inventory = {
    totalProducts: products.length,
    lowStock: products.filter((product) => {
      const stock =
        product.variants.length > 0
          ? product.variants.reduce((total, variant) => total + variant.stock, 0)
          : product.quantity;
      return stock > 0 && stock <= 3;
    }).length,
    outOfStock: products.filter((product) => {
      const stock =
        product.variants.length > 0
          ? product.variants.reduce((total, variant) => total + variant.stock, 0)
          : product.quantity;
      return stock === 0;
    }).length,
    stockValuePesewas: products.reduce((total, product) => {
      const stock =
        product.variants.length > 0
          ? product.variants.reduce((sum, variant) => sum + variant.stock, 0)
          : product.quantity;
      return total + stock * product.pricePesewas;
    }, 0),
  };

  const dailySales = [...daily.entries()]
    .map(([date, value]) => ({ date, ...value }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    periodDays,
    grossSalesPesewas,
    deliveryFeesPesewas,
    refundsPesewas,
    // Payable to the vendor: gross sales minus refunds. Delivery fees belong to
    // the platform and are reported separately, never mixed into sales.
    payablePesewas: Math.max(0, grossSalesPesewas - refundsPesewas),
    orderCounts: {
      total: vendorOrders.length,
      pending: countByStatus("PENDING"),
      accepted: countByStatus("ACCEPTED"),
      preparing: countByStatus("PREPARING"),
      readyForPickup: countByStatus("READY_FOR_PICKUP"),
      outForDelivery: countByStatus("OUT_FOR_DELIVERY"),
      delivered: countByStatus("DELIVERED"),
      cancelled: countByStatus("CANCELLED"),
    },
    productPerformance,
    inventory,
    dailySales,
    topVendors: [],
  };
}
