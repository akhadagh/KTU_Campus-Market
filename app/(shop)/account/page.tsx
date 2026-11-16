import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BadgeCheck,
  Bell,
  Heart,
  Package,
  Receipt,
  ShoppingBag,
  Sparkles,
  Wallet,
} from "lucide-react";
import { ProductCard } from "@/components/commerce/product-card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { listRecommendedProducts } from "@/lib/marketplace";
import { formatPesewas } from "@/lib/money";
import { orderStatusLabels } from "@/lib/labels";

export const metadata: Metadata = { title: "My account" };

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(date);

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");
  const userId = session.user.id;

  const [orderGroups, wishlistCount, notifications, recommendations, pendingReviews] =
    await Promise.all([
      prisma.order.groupBy({
        by: ["status"],
        where: { buyerId: userId, deletedAt: null },
        _count: { _all: true },
        _sum: { totalPesewas: true },
      }),
      prisma.wishlistItem.count({ where: { wishlist: { userId } } }),
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, body: true, link: true, readAt: true, createdAt: true },
      }),
      listRecommendedProducts({ userId, limit: 4 }),
      prisma.orderItem.count({
        where: {
          vendorOrder: { order: { buyerId: userId, status: "FULFILLED" } },
          review: null,
        },
      }),
    ]);

  const statusCount = (status: string) =>
    orderGroups.find((group) => group.status === status)?._count._all ?? 0;
  const totalSpent =
    orderGroups
      .filter((group) => ["PAID", "PARTIALLY_FULFILLED", "FULFILLED"].includes(group.status))
      .reduce((total, group) => total + (group._sum.totalPesewas ?? 0), 0) ?? 0;

  const [recentOrders, openDisputes] = await Promise.all([
    prisma.order.findMany({
      where: { buyerId: userId, deletedAt: null },
      orderBy: { placedAt: "desc" },
      take: 4,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalPesewas: true,
        placedAt: true,
        _count: { select: { vendorOrders: true } },
      },
    }),
    prisma.dispute.count({
      where: { raisedById: userId, status: { in: ["OPEN", "UNDER_REVIEW"] } },
    }),
  ]);

  const stats = [
    {
      label: "Total orders",
      value: String(
        statusCount("PAID") +
          statusCount("PENDING_PAYMENT") +
          statusCount("PARTIALLY_FULFILLED") +
          statusCount("FULFILLED") +
          statusCount("CANCELLED"),
      ),
      icon: ShoppingBag,
    },
    {
      label: "Awaiting fulfilment",
      value: String(statusCount("PAID") + statusCount("PARTIALLY_FULFILLED")),
      icon: Package,
    },
    { label: "Completed", value: String(statusCount("FULFILLED")), icon: BadgeCheck },
    { label: "Cancelled", value: String(statusCount("CANCELLED")), icon: Receipt },
    { label: "Total spent", value: formatPesewas(totalSpent), icon: Wallet },
    { label: "Saved items", value: String(wishlistCount), icon: Heart },
  ];

  return (
    <div>
      <PageHeader
        title={`Hello, ${session.user.fullName.split(" ")[0]}`}
        description="Your shopping activity on JUMART, all in one place."
      />

      <div className="mt-5 flex flex-wrap gap-2">
        <Badge variant={session.user.emailVerifiedAt ? "success" : "warning"}>
          {session.user.emailVerifiedAt ? "Email verified" : "Email not verified"}
        </Badge>
        {pendingReviews > 0 ? (
          <Badge variant="default">{pendingReviews} item(s) waiting for a review</Badge>
        ) : null}
        {openDisputes > 0 ? (
          <Badge variant="danger">{openDisputes} open problem report(s)</Badge>
        ) : null}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-neutral-200/80 p-5 shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                  {stat.label}
                </p>
                <Icon className="text-brand-600 h-4 w-4" aria-hidden="true" />
              </div>
              <p className="mt-2 text-2xl font-bold text-neutral-900">{stat.value}</p>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-neutral-900">Recent purchases</h2>
            <Link href="/orders" className="text-brand-700 text-sm font-medium hover:underline">
              View all
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="mt-4 text-center">
              <p className="text-sm text-neutral-600">You have not placed an order yet.</p>
              <div className="mt-3 flex justify-center">
                <Link href="/marketplace" className={buttonVariants()}>
                  Browse the marketplace
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-neutral-100">
              {recentOrders.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-sm font-semibold text-neutral-900 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="text-xs text-neutral-500">
                      {formatDate(order.placedAt)} · {order._count.vendorOrders} seller
                      {order._count.vendorOrders === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Badge variant={order.status === "CANCELLED" ? "danger" : "muted"}>
                    {orderStatusLabels[order.status] ?? order.status}
                  </Badge>
                  <span className="text-sm font-semibold text-neutral-900">
                    {formatPesewas(order.totalPesewas)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
              <Bell className="text-brand-600 h-4 w-4" aria-hidden="true" />
              Notifications
            </h2>
            <Link
              href="/notifications"
              className="text-brand-700 text-sm font-medium hover:underline"
            >
              View all
            </Link>
          </div>
          {notifications.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-600">Nothing new right now.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {notifications.map((notification) => (
                <li key={notification.id} className="flex gap-3">
                  <span
                    className={
                      notification.readAt
                        ? "mt-1.5 h-2 w-2 shrink-0 rounded-full bg-neutral-200"
                        : "bg-accent-500 mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    }
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900">{notification.title}</p>
                    {notification.body ? (
                      <p className="line-clamp-2 text-xs text-neutral-600">{notification.body}</p>
                    ) : null}
                    {notification.link ? (
                      <Link
                        href={notification.link}
                        className="text-brand-700 text-xs font-medium hover:underline"
                      >
                        Open
                      </Link>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <Sparkles className="text-accent-500 h-4 w-4" aria-hidden="true" />
            Recommended for you
          </h2>
          <Link href="/marketplace" className="text-brand-700 text-sm font-medium hover:underline">
            Browse everything
          </Link>
        </div>
        {recommendations.length === 0 ? (
          <Card className="mt-3 p-6 text-center text-sm text-neutral-600">
            No recommendations yet. Browse a few products and they will appear here.
          </Card>
        ) : (
          <div className="mt-3 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {recommendations.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
