import type { Metadata } from "next";
import Link from "next/link";
import { Package } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="My orders"
        description="Track purchases, pickup status, and delivery updates. Order history is connected in Milestone 5."
      />
      <div className="mt-6">
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="Once checkout is connected, your orders and status history will appear here. Only you can access your orders."
          action={
            <Link href="/marketplace" className={buttonVariants()}>
              Start shopping
            </Link>
          }
        />
      </div>
    </div>
  );
}
