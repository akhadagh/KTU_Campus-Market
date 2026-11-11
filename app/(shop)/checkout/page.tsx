import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/commerce/checkout-form";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { getCartSummary, getOrCreateCart } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { DELIVERY_FEES_PESEWAS } from "@/lib/orders";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/checkout");

  const cart = await getOrCreateCart();
  const summary = await getCartSummary(cart.id);
  if (summary.items.length === 0) redirect("/cart");

  const pickupLocations = await prisma.pickupLocation.findMany({
    where: { isActive: true, campusId: session.user.campusId ?? undefined },
    select: { id: true, name: true, address: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Checkout"
        description="Confirm how you want to receive the items, then pay securely with Paystack."
      />
      <div className="mt-6">
        <CheckoutForm
          lines={summary.items.map((item) => ({
            productName: item.productName,
            vendorName: item.vendorName,
            quantity: item.quantity,
            lineTotalPesewas: item.lineTotalPesewas,
            isDigital: item.isDigital,
          }))}
          subtotalPesewas={summary.subtotalPesewas}
          pickupLocations={pickupLocations}
          deliveryFeePesewas={DELIVERY_FEES_PESEWAS.CAMPUS_DELIVERY}
        />
      </div>
    </div>
  );
}
