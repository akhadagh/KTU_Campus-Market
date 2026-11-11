import type { Metadata } from "next";
import { Signal } from "lucide-react";
import { AirtimePurchase } from "@/components/commerce/airtime-purchase";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Airtime & data bundles",
  description:
    "Buy airtime and data bundles for every Ghanaian network, on Campus Market or through the provider's own site.",
};

export default async function AirtimePage() {
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      vendor: { status: "ACTIVE" },
      OR: [{ purchaseMode: "EXTERNAL" }, { deliveryOptions: { has: "DIGITAL" } }],
    },
    orderBy: [{ createdAt: "desc" }],
    take: 60,
    select: {
      id: true,
      slug: true,
      name: true,
      pricePesewas: true,
      purchaseMode: true,
      externalUrl: true,
      digitalDetails: true,
      images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
      vendor: { select: { storeName: true } },
    },
  });

  const listings = products.map((product) => {
    const details = (product.digitalDetails ?? {}) as {
      network?: string;
      dataAmount?: string;
      validity?: string;
    };
    return {
      id: product.id,
      slug: product.slug,
      name: product.name,
      pricePesewas: product.pricePesewas,
      vendorName: product.vendor.storeName,
      purchaseMode: product.purchaseMode,
      externalUrl: product.externalUrl,
      network: details.network ?? null,
      dataAmount: details.dataAmount ?? null,
      validity: details.validity ?? null,
      imageUrl: product.images[0]?.url ?? null,
    };
  });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Airtime & data bundles"
        description="Top up any Ghanaian number. Pay on Campus Market and let the seller credit you, or continue straight to the provider's site."
      />
      <p className="bg-brand-50 text-brand-900 mt-3 flex items-start gap-2 rounded-lg p-3 text-sm">
        <Signal className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        Digital bundles are delivered to the phone number you enter, so double-check it before you
        pay.
      </p>

      <div className="mt-6">
        {listings.length === 0 ? (
          <p className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600">
            No bundles are listed yet. Approved vendors can add airtime and data packages from their
            product dashboard.
          </p>
        ) : (
          <AirtimePurchase listings={listings} />
        )}
      </div>
    </div>
  );
}
