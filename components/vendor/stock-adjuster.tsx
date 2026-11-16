"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function StockAdjuster({
  productId,
  currentStock,
  hasVariants,
  variants,
}: {
  productId: string;
  currentStock: number;
  hasVariants: boolean;
  variants: { id: string; name: string; stock: number }[];
}) {
  const router = useRouter();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [value, setValue] = useState(String(currentStock));
  const [pending, setPending] = useState(false);

  async function save() {
    const quantity = Number(value);
    if (!Number.isInteger(quantity) || quantity < 0) {
      toast.error("Enter a whole number of items");
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/v1/vendor/products/${productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity,
          ...(hasVariants && variantId ? { variantId } : {}),
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not update the stock");
        return;
      }
      toast.success("Stock updated");
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  function nudge(delta: number) {
    setValue((current) => String(Math.max(0, Number(current || 0) + delta)));
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {hasVariants ? (
        <Select
          value={variantId}
          onChange={(event) => {
            setVariantId(event.target.value);
            const variant = variants.find((item) => item.id === event.target.value);
            if (variant) setValue(String(variant.stock));
          }}
          aria-label="Variant"
          className="h-9 w-28"
        >
          {variants.map((variant) => (
            <option key={variant.id} value={variant.id}>
              {variant.name}
            </option>
          ))}
        </Select>
      ) : null}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => nudge(-1)}
          aria-label="Decrease stock"
          className="focus-visible:ring-brand-500/30 grid h-9 w-9 place-items-center rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:outline-none"
        >
          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <Input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          inputMode="numeric"
          aria-label="Stock quantity"
          className="h-9 w-20"
        />
        <button
          type="button"
          onClick={() => nudge(1)}
          aria-label="Increase stock"
          className="focus-visible:ring-brand-500/30 grid h-9 w-9 place-items-center rounded-lg border border-neutral-300 text-neutral-600 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:outline-none"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <Button size="sm" variant="outline" onClick={save} disabled={pending}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
        Save
      </Button>
    </div>
  );
}
