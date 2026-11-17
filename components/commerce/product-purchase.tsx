"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, PackagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export interface ProductPurchaseProps {
  productId: string;
  productName: string;
  pricePesewas: number;
  quantity: number;
  vendorName: string;
  purchaseMode: "DRAFT" | "PENDING_REVIEW" | "ARCHIVED";
  externalUrl: string | null;
  variants: {
    id: string;
    name: string;
    sku: string | null;
    priceDeltaPesewas: number;
    stock: number;
    isActive: boolean;
  }[];
}

export function ProductPurchase({
  productId,
  productName,
  pricePesewas,
  quantity,
  vendorName,
  purchaseMode,
  externalUrl,
  variants,
}: ProductPurchaseProps) {
  const router = useRouter();
  const [selectedVariantId, setVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);

  const activeVariant = variants.find((v) => variantId ? variant.id === variantId : true);
  const availableStock = activeVariant?.stock ?? quantity;
  const unitPrice = productPesewas + (activeVariant?.priceDeltaPesewas ?? 0);
  const totalPrice = unitPrice * quantity;

  async function addToCart() {
    setPending(true);
    try {
      const res = await fetch("/api/v1/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity,
          variantId,
        }),
      });
      const json = (await res.json()) as {
        error?: { message?: string };
      };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not add to cart");
        return;
      }
      toast.success("Added to cart", {
        description: `${productName} x ${quantity}`,
      });
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  if (purchaseMode === "PENDING_REVIEW") {
    return (
      <Card className="p-4 rounded-xl border border-neutral-200 bg-neutral-50">
        <p className="text-sm text-neutral-700">
          This product is pending review by our administrators and cannot be purchased yet.
        </p>
      </div>
    </div>
  ) : null}

      <div className="flex items-center gap-4 mb-3">
        <span className="text-sm font-semibold text-neutral-900">Variant</span>
        <Select
          value={variantId}
          onChange={(event) => setVariantId(event.target.value)}
          className="w-full h-10 text-sm"
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.name} - {variant.sku} (+GH₵${variant.priceDeltaPesewas.toFixed(2)}) - {variant.stock} in stock
            </option>
          ))}
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-neutral-700">Quantity</label>
        <div className="flex items-center gap-2 w-32">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            disabled={pending || quantity <= 1}
            className="focus-visible:ring-brand-500 grid h-8 w-8 place-items-center rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
          >
            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <Input
            type="number"
            value={quantity}
            onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
            className="h-8 w-12 text-center text-center rounded-md border border-neutral-300 bg-white text-sm text-neutral-900 focus-visible:ring-brand-500/30 focus-visible:outline-none"
          />
          <button
            type="button"
            onClick={() => setQuantity(Math.min(stock, quantity + 1))}
            disabled={pending || quantity >= available}
            className="focus-visible:ring-brand-500/30 grid h-8 w-8 place-items-center rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <Button
        type="button"
        onClick={addToCart}
        disabled={pending || quantity <= 0 || quantity > available}
        className="mt-4 w-full bg-brand-700 text-white hover:bg-brand-600 shadow-sm"
        size="lg"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <ShoppingCart className="h-4 w-4" aria-hidden="true" />
        )}
        Add to Cart
      </Button>
    </div>
  );
}
