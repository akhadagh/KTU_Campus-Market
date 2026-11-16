import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getAuthContext, hasRole } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export async function AdminDashboard({ children }: { children: ReactNode }) {
  const auth = await getAuthContext();
  if (!auth) redirect("/login?next=/admin");
  if (!hasRole(auth, "admin") && !hasRole(auth, "moderator")) redirect("/");

  const [pendingVendors, pendingListings, openReports, openDisputes, pendingRefunds] =
    await Promise.all([
      prisma.vendorProfile.count({ where: { status: "PENDING" } }),
      prisma.product.count({ where: { status: "PENDING_REVIEW", deletedAt: null } }),
      prisma.report.count({ where: { status: { in: ["OPEN", "IN_REVIEW"] } } }),
      prisma.dispute.count({ where: { status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
      prisma.refund.count({ where: { status: "REQUESTED" } }),
    ]);

  const items = [
    { href: "/admin", label: "Overview", icon: "overview" as const },
    { href: "/admin/vendors", label: "Vendors", icon: "vendors" as const, badge: pendingVendors },
    {
      href: "/admin/products",
      label: "Listings",
      icon: "listings" as const,
      badge: pendingListings,
    },
    { href: "/admin/orders", label: "Orders", icon: "orders" as const },
    { href: "/admin/transactions", label: "Transactions", icon: "transactions" as const },
    { href: "/admin/refunds", label: "Refunds", icon: "refunds" as const, badge: pendingRefunds },
    { href: "/admin/disputes", label: "Disputes", icon: "disputes" as const, badge: openDisputes },
    { href: "/admin/reports", label: "Reports", icon: "reports" as const, badge: openReports },
    { href: "/admin/reviews", label: "Reviews", icon: "reviews" as const },
    { href: "/admin/messages", label: "Support", icon: "support" as const },
    { href: "/admin/airtime", label: "Airtime links", icon: "airtime" as const },
    { href: "/admin/resources", label: "Learning materials", icon: "materials" as const },
    { href: "/admin/students", label: "Students", icon: "students" as const },
    { href: "/admin/users", label: "Users", icon: "users" as const },
    { href: "/admin/categories", label: "Categories", icon: "categories" as const },
    { href: "/admin/audit", label: "Audit log", icon: "audit" as const },
    { href: "/admin/settings", label: "Platform settings", icon: "settings" as const },
  ];

  return (
    <DashboardShell title="Administration" subtitle="Platform control" items={items}>
      {children}
    </DashboardShell>
  );
}
