import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Shopping cart"
        description="Items from multiple vendors will be grouped into separate vendor orders at checkout."
      />
      <div className="mt-6">
        <EmptyState
          icon={ShoppingCart}
          title="Your cart is empty"
          description="Cart and checkout are connected in Milestone 5. For now, browse the sample marketplace to see the planned experience."
          action={
            <Link href="/marketplace" className={buttonVariants()}>
              Browse marketplace
            </Link>
          }
        />
      </div>
    </div>
  );
}
