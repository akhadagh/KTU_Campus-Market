import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, LifeBuoy, ShieldCheck, Signal, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/db";
import { formatPesewas } from "@/lib/money";

export const metadata: Metadata = {
  title: "Airtime & data bundles",
  description:
    "Top up MTN, Telecel, Vodafone and AirtelTigo through verified JUMART merchants. Every link is reviewed by our team before it goes live.",
};

interface MerchantGroup {
  id: string;
  storeName: string;
  slug: string;
  description: string | null;
  phone: string | null;
  packages: {
    id: string;
    slug: string;
    name: string;
    pricePesewas: number;
    externalUrl: string | null;
    network: string | null;
    dataAmount: string | null;
    validity: string | null;
    imageUrl: string | null;
  }[];
}

export default async function AirtimePage() {
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
      deletedAt: null,
      purchaseMode: "EXTERNAL",
      externalStatus: "APPROVED",
      vendor: { status: "ACTIVE" },
    },
    orderBy: [{ pricePesewas: "asc" }],
    take: 120,
    select: {
      id: true,
      slug: true,
      name: true,
      pricePesewas: true,
      externalUrl: true,
      digitalDetails: true,
      images: { select: { url: true }, orderBy: { sortOrder: "asc" }, take: 1 },
      vendor: {
        select: {
          id: true,
          storeName: true,
          slug: true,
          description: true,
          phone: true,
        },
      },
    },
  });

  const merchants = new Map<string, MerchantGroup>();
  for (const product of products) {
    const details = (product.digitalDetails ?? {}) as {
      network?: string;
      dataAmount?: string;
      validity?: string;
    };
    const existing = merchants.get(product.vendor.id);
    const entry = {
      id: product.id,
      slug: product.slug,
      name: product.name,
      pricePesewas: product.pricePesewas,
      externalUrl: product.externalUrl,
      network: details.network ?? null,
      dataAmount: details.dataAmount ?? null,
      validity: details.validity ?? null,
      imageUrl: product.images[0]?.url ?? null,
    };
    if (existing) {
      existing.packages.push(entry);
    } else {
      merchants.set(product.vendor.id, {
        id: product.vendor.id,
        storeName: product.vendor.storeName,
        slug: product.vendor.slug,
        description: product.vendor.description,
        phone: product.vendor.phone,
        packages: [entry],
      });
    }
  }

  const groups = [...merchants.values()];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Airtime & data bundles"
        description="Top up any Ghanaian number through the verified merchants below. Choose the package you want, then you will be taken to the merchant's own site or app to complete the purchase."
      />

      <Card className="border-brand-100 from-brand-50 mt-6 bg-gradient-to-br to-white p-5">
        <div className="flex items-start gap-3">
          <div className="bg-brand-700 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">
              Every link is checked by our team
            </p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Merchants register their own site or app, and an administrator verifies the link
              before students can use it. Purchases are completed on the merchant&rsquo;s platform,
              not by JUMART.
            </p>
          </div>
        </div>
      </Card>

      {groups.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Signal}
            title="No verified merchants yet"
            description="Vendors can register their airtime and data links from their store dashboard. Once an administrator approves them they appear here."
            action={
              <Link href="/sell" className={buttonVariants()}>
                Sell on JUMART
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map((merchant) => (
            <Card
              key={merchant.id}
              className="overflow-hidden border-neutral-200/80 shadow-[var(--shadow-card)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 bg-neutral-50/70 p-5">
                <div className="flex items-start gap-3">
                  <div className="bg-brand-700 grid h-11 w-11 shrink-0 place-items-center rounded-xl text-white">
                    <Store className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/stores/${merchant.slug}`}
                        className="text-base font-semibold text-neutral-900 hover:underline"
                      >
                        {merchant.storeName}
                      </Link>
                      <Badge variant="success">Verified merchant</Badge>
                    </div>
                    {merchant.description ? (
                      <p className="mt-1 max-w-2xl text-sm text-neutral-600">
                        {merchant.description}
                      </p>
                    ) : null}
                    {merchant.phone ? (
                      <p className="mt-1 text-xs text-neutral-500">{merchant.phone}</p>
                    ) : null}
                  </div>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-600">
                  {merchant.packages.length} package{merchant.packages.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {merchant.packages.map((pack) => (
                  <div
                    key={pack.id}
                    className="hover:border-brand-200 flex flex-col justify-between rounded-xl border border-neutral-200 p-4 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-neutral-900">{pack.name}</p>
                      <p className="mt-1 text-xs text-neutral-500">
                        {[
                          pack.network,
                          pack.dataAmount,
                          pack.validity ? `valid ${pack.validity}` : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      <p className="mt-2 text-lg font-bold text-neutral-900">
                        {formatPesewas(pack.pricePesewas)}
                      </p>
                    </div>
                    {pack.externalUrl ? (
                      <a
                        href={pack.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${buttonVariants()} mt-4 w-full`}
                      >
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                        Buy with {merchant.storeName}
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            </Card>
          ))}

          <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div className="flex items-start gap-3">
              <LifeBuoy className="text-brand-600 mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  A merchant&rsquo;s link looks wrong or does not work?
                </p>
                <p className="text-sm text-neutral-600">
                  Tell us and we will review it with the merchant.
                </p>
              </div>
            </div>
            <Link href="/messages" className={buttonVariants({ variant: "outline" })}>
              Contact JUMART
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
}
