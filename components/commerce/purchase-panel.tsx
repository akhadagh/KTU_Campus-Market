"use client";

import { ExternalLink, Radio, Smartphone } from "lucide-react";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { buttonVariants } from "@/components/ui/button";

export interface PurchaseTarget {
  productId: string;
  productName: string;
  pricePesewas: number;
  quantity: number;
  vendorName: string;
  purchaseMode: "INTERNAL" | "EXTERNAL";
  externalUrl: string | null;
  isDigital: boolean;
  network?: string | null;
  dataAmount?: string | null;
  validity?: string | null;
}

export function PurchasePanel({ target }: { target: PurchaseTarget }) {
  if (target.purchaseMode === "EXTERNAL" && target.externalUrl) {
    return (
      <div className="space-y-3">
        <a
          href={target.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`${buttonVariants({ size: "lg" })} w-full sm:w-auto`}
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Continue to {target.vendorName}
        </a>
        <p className="flex items-start gap-2 text-xs leading-5 text-neutral-500">
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          This bundle is sold on the seller&rsquo;s own site or app. You will be redirected there to
          complete the purchase, and Campus Market does not handle that payment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AddToCartButton
        productId={target.productId}
        productName={target.productName}
        pricePesewas={target.pricePesewas}
        quantity={target.quantity}
        vendorName={target.vendorName}
      />
      {target.isDigital ? (
        <p className="flex items-start gap-2 text-xs leading-5 text-neutral-500">
          <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Digital delivery. Add it to your cart, then enter the phone number that should receive the
          bundle at checkout.
        </p>
      ) : null}
      {target.network || target.dataAmount ? (
        <p className="flex items-center gap-2 text-xs text-neutral-500">
          <Radio className="h-3.5 w-3.5" aria-hidden="true" />
          {[
            target.network,
            target.dataAmount,
            target.validity ? `valid for ${target.validity}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
      ) : null}
    </div>
  );
}
