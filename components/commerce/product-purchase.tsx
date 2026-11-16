"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { VariantSelector, type VariantOption } from "@/components/commerce/variant-selector";
import { formatPesewas } from "@/lib/money";

export function ProductPurchase({
  productId,
  productName,
  pricePesewas,
  stock,
  vendorName,
  purchaseMode,
  externalUrl,
  variants,
}: {
  productId: string;
  productName: string;
  pricePesewas: number;
  stock: number;
  vendorName: string;
  purchaseMode: "INTERNAL" | "EXTERNAL";
  externalUrl: string | null;
  variants: VariantOption[];
}) {
  const router = useRouter();
  const [variantId, setVariantId] = useState<string | null>(
    variants.find((variant) => variant.stock > 0)?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);

  if (purchaseMode === "EXTERNAL" && externalUrl) {
    return (
      <div className="space-y-3">
        <a
          href={externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-brand-700 hover:bg-brand-600 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-6 text-base font-semibold text-white transition-all sm:w-auto"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Continue to {vendorName}
        </a>
        <p className="flex items-start gap-2 text-xs leading-5 text-neutral-500">
          <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          This bundle is sold on the seller&rsquo;s own site or app. You will be redirected there to
          complete the purchase, and JUMART does not handle that payment.
        </p>
      </div>
    );
  }

  const activeVariant = variants.find((variant) => variant.id === variantId) ?? null;
  const available = activeVariant ? activeVariant.stock : stock;

  async function addToCart() {
    if (available < 1) {
      toast.error("That option is out of stock");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/v1/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          ...(variantId ? { variantId } : {}),
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not add to cart");
        return;
      }
      const unit = activeVariant ? pricePesewas + activeVariant.priceDeltaPesewas : pricePesewas;
      toast.success("Added to cart", {
        description: `${productName} · ${formatPesewas(unit)} · ${vendorName}`,
      });
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {variants.length > 0 ? (
        <VariantSelector
          variants={variants}
          basePricePesewas={pricePesewas}
          onSelect={(nextVariantId) => setVariantId(nextVariantId)}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-28">
          <label
            htmlFor="product-quantity"
            className="mb-1 block text-xs font-medium text-neutral-700"
          >
            Quantity
          </label>
          <input
            id="product-quantity"
            type="number"
            min="1"
            max={Math.max(1, available)}
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
            className="focus-visible:border-brand-500 h-11 w-28 rounded-xl border border-neutral-300 bg-white px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:outline-none"
          />
        </div>
        <Button size="lg" onClick={addToCart} disabled={pending || available < 1}>
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <ShoppingCart className="h-4 w-4" aria-hidden="true" />
          )}
          {available < 1 ? "Out of stock" : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}
