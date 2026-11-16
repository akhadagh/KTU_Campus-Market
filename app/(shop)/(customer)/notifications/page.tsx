import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { MarkNotificationsReadButton } from "@/components/notifications/mark-notifications-read-button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/notifications");

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      type: true,
      title: true,
      body: true,
      link: true,
      readAt: true,
      createdAt: true,
    },
  });
  const unread = notifications.filter((notification) => notification.readAt === null).length;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Notifications"
        description={
          unread > 0
            ? `${unread} unread update${unread === 1 ? "" : "s"}.`
            : "You are all caught up."
        }
        actions={<MarkNotificationsReadButton />}
      />

      {notifications.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="Order updates, approvals, and messages appear here."
            action={
              <Link
                href="/marketplace"
                className="text-brand-700 text-sm font-medium hover:underline"
              >
                Browse the marketplace
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-2">
          {notifications.map((notification) => (
            <li key={notification.id}>
              <Card
                className={
                  notification.readAt === null ? "border-brand-200 bg-brand-50/40 p-4" : "p-4"
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-neutral-900">{notification.title}</p>
                  <Badge variant="muted">{notification.type}</Badge>
                </div>
                {notification.body ? (
                  <p className="mt-1 text-sm text-neutral-600">{notification.body}</p>
                ) : null}
                <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                  <span>
                    {new Intl.DateTimeFormat("en-GH", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(notification.createdAt)}
                  </span>
                  {notification.link ? (
                    <Link
                      href={notification.link}
                      className="text-brand-700 font-medium hover:underline"
                    >
                      View
                    </Link>
                  ) : null}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
