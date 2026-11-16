import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function CustomerDashboard({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");

  const [unreadMessages, unreadNotifications, wishlistCount] = await Promise.all([
    prisma.message.count({
      where: {
        readAt: null,
        conversation: { buyerId: session.user.id, kind: "SELLER" },
        senderId: { not: session.user.id },
      },
    }),
    prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
    prisma.wishlistItem.count({ where: { wishlist: { userId: session.user.id } } }),
  ]);

  const items = [
    { href: "/account", label: "Overview", icon: "overview" as const },
    { href: "/orders", label: "My orders", icon: "orders" as const },
    { href: "/wishlist", label: "Saved items", icon: "wishlist" as const, badge: wishlistCount },
    { href: "/messages", label: "Messages", icon: "messages" as const, badge: unreadMessages },
    {
      href: "/notifications",
      label: "Notifications",
      icon: "notifications" as const,
      badge: unreadNotifications,
    },
    { href: "/account/profile", label: "Profile & security", icon: "profile" as const },
    { href: "/account/addresses", label: "Delivery addresses", icon: "address" as const },
    { href: "/account/verification", label: "Student verification", icon: "verification" as const },
    { href: "/account/requests", label: "Support requests", icon: "requests" as const },
    { href: "/account/close", label: "Close account", icon: "close" as const },
  ];

  return (
    <DashboardShell title="My account" subtitle={session.user.fullName} items={items}>
      {children}
    </DashboardShell>
  );
}
