import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireVendor } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export async function VendorDashboard({ children }: { children: ReactNode }) {
  const auth = await requireVendor();

  const [pendingOrders, unreadMessages, lowStock, openReviews] = await Promise.all([
    prisma.vendorOrder.count({
      where: {
        vendorId: auth.vendorId,
        status: {
          in: ["PENDING", "ACCEPTED", "PREPARING", "READY_FOR_PICKUP", "OUT_FOR_DELIVERY"],
        },
      },
    }),
    prisma.message.count({
      where: {
        readAt: null,
        conversation: { vendorId: auth.vendorId },
        senderId: { not: auth.user.id },
      },
    }),
    prisma.product.count({
      where: { vendorId: auth.vendorId, deletedAt: null, quantity: { lte: 3 } },
    }),
    prisma.review.count({ where: { vendorId: auth.vendorId, status: "PENDING" } }),
  ]);

  const items = [
    { href: "/sell/dashboard", label: "Overview", icon: "overview" as const },
    { href: "/sell/products", label: "Products", icon: "products" as const },
    { href: "/sell/products/new", label: "Add product", icon: "addProduct" as const },
    { href: "/sell/inventory", label: "Inventory", icon: "inventory" as const, badge: lowStock },
    { href: "/sell/orders", label: "Orders", icon: "orders" as const, badge: pendingOrders },
    { href: "/sell/deliveries", label: "Deliveries", icon: "delivery" as const },
    { href: "/sell/analytics", label: "Sales & analytics", icon: "analytics" as const },
    { href: "/sell/payouts", label: "Payouts & ledger", icon: "payouts" as const },
    { href: "/sell/store", label: "Store settings", icon: "store" as const },
    { href: "/sell/messages", label: "Messages", icon: "messages" as const, badge: unreadMessages },
    { href: "/sell/reviews", label: "Reviews", icon: "reviews" as const, badge: openReviews },
  ];

  return (
    <DashboardShell title="Seller workspace" subtitle="Your store" items={items} accent="accent">
      {children}
    </DashboardShell>
  );
}

export async function VendorDashboardBoundary({ children }: { children: ReactNode }) {
  const session = await prisma.session.count();
  if (session < 0) redirect("/");
  return <VendorDashboard>{children}</VendorDashboard>;
}
