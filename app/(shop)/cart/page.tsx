import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { CartView } from "@/components/commerce/cart-view";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getCartSummary, getOrCreateCart } from "@/lib/cart";

export const metadata: Metadata = { title: "Cart" };

export default async function CartPage() {
  const cart = await getOrCreateCart();
  const summary = await getCartSummary(cart.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Shopping cart"
        description="Items from multiple vendors will be grouped into separate vendor orders at checkout."
      />

      {summary.items.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={ShoppingCart}
            title="Your cart is empty"
            description="Browse the marketplace and add products from any vendor."
            action={
              <Link href="/marketplace" className={buttonVariants()}>
                Browse marketplace
              </Link>
            }
          />
        </div>
      ) : (
        <CartView
          items={summary.items}
          subtotalPesewas={summary.subtotalPesewas}
          vendorCount={summary.vendorCount}
        />
      )}
    </div>
  );
}
