import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "Wishlist" };

export default function WishlistPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Wishlist"
        description="Save products you want to revisit. Wishlist persistence is connected in Milestone 5."
      />
      <div className="mt-6">
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          description="Saved products will appear here once accounts and the marketplace database are connected."
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
