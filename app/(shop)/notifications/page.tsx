import type { Metadata } from "next";
import Link from "next/link";
import { Bell } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Notifications"
        description="Order updates, payment confirmations, messages, disputes, and verification notices."
      />
      <div className="mt-6">
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="In-app notifications are connected in Milestones 3–8 as the relevant features are built."
          action={
            <Link href="/marketplace" className={buttonVariants()}>
              Explore marketplace
            </Link>
          }
        />
      </div>
    </div>
  );
}
