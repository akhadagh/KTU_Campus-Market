"use client";

import { useMemo, useState } from "react";
import { ExternalLink, Loader2, Radio, Signal } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPesewas } from "@/lib/money";

export interface BundleListing {
  id: string;
  slug: string;
  name: string;
  pricePesewas: number;
  vendorName: string;
  purchaseMode: "INTERNAL" | "EXTERNAL";
  externalUrl: string | null;
  network: string | null;
  dataAmount: string | null;
  validity: string | null;
  imageUrl: string | null;
}

const NETWORKS = ["All", "MTN", "Telecel", "Vodafone", "AirtelTigo"] as const;

export function AirtimePurchase({ listings }: { listings: BundleListing[] }) {
  const [network, setNetwork] = useState<(typeof NETWORKS)[number]>("All");
  const [msisdn, setMsisdn] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      network === "All" ? listings : listings.filter((listing) => listing.network === network),
    [listings, network],
  );

  async function addToCart(listing: BundleListing) {
    if (!msisdn.trim()) {
      toast.error("Enter the phone number that should receive the bundle");
      return;
    }
    setPending(listing.id);
    try {
      const res = await fetch("/api/v1/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: listing.id, quantity: 1 }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not add the bundle to your cart");
        return;
      }
      toast.success("Bundle added", {
        description: `${listing.name} for ${msisdn}. Confirm the number at checkout.`,
      });
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <Card className="h-fit p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Who is buying?</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Enter the number that will receive the airtime or data bundle.
        </p>
        <label htmlFor="airtime-msisdn" className="mt-4 block text-xs font-medium text-neutral-700">
          Phone number
        </label>
        <Input
          id="airtime-msisdn"
          className="mt-1"
          inputMode="tel"
          placeholder="0241234567"
          value={msisdn}
          onChange={(event) => setMsisdn(event.target.value)}
        />
        <p className="mt-2 text-xs text-neutral-500">
          Ghanaian numbers only, e.g. 0241234567 or +233241234567.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {NETWORKS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setNetwork(item)}
              className={
                network === item
                  ? "bg-brand-700 rounded-full px-3 py-1 text-xs font-semibold text-white"
                  : "rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
              }
            >
              {item}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        {visible.length === 0 ? (
          <Card className="p-6 text-sm text-neutral-600 sm:col-span-2">
            No bundles listed for this network yet. Check back soon.
          </Card>
        ) : (
          visible.map((listing) => (
            <Card key={listing.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-neutral-900">{listing.name}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {[
                      listing.network,
                      listing.dataAmount,
                      listing.validity ? `valid for ${listing.validity}` : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <p className="text-base font-semibold text-neutral-900">
                  {formatPesewas(listing.pricePesewas)}
                </p>
              </div>
              <p className="text-xs text-neutral-500">Sold by {listing.vendorName}</p>
              {listing.purchaseMode === "EXTERNAL" && listing.externalUrl ? (
                <a
                  href={listing.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${buttonVariants({ variant: "outline" })} w-full`}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Buy on provider site
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => addToCart(listing)}
                  disabled={pending !== null}
                  className={`${buttonVariants()} w-full`}
                >
                  {pending === listing.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Radio className="h-4 w-4" aria-hidden="true" />
                  )}
                  Buy on Campus Market
                </button>
              )}
            </Card>
          ))
        )}
        <p className="flex items-start gap-2 text-xs leading-5 text-neutral-500 sm:col-span-2">
          <Signal className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Bundles marked &ldquo;Buy on provider site&rdquo; are fulfilled by the network or vendor
          directly. Everything else is paid for on Campus Market and credited by the seller after
          your order is confirmed.
        </p>
      </div>
    </div>
  );
}
