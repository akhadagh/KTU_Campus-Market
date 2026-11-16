"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { formatPesewas } from "@/lib/money";

export interface VariantOption {
  id: string;
  name: string;
  priceDeltaPesewas: number;
  stock: number;
}

/**
 * Variant selection for a product. The chosen variant is carried into the cart
 * and the order, and its stock is validated before the item is added.
 */
export function VariantSelector({
  variants,
  basePricePesewas,
  onSelect,
}: {
  variants: VariantOption[];
  basePricePesewas: number;
  onSelect: (variantId: string | null) => void;
}) {
  const initial = variants.find((variant) => variant.stock > 0) ?? variants[0] ?? null;
  const [selected, setSelected] = useState<string | null>(initial?.id ?? null);

  const active = useMemo(
    () => variants.find((variant) => variant.id === selected) ?? null,
    [variants, selected],
  );
  const price = active ? basePricePesewas + active.priceDeltaPesewas : basePricePesewas;

  function choose(variantId: string) {
    setSelected(variantId);
    onSelect(variantId);
    const variant = variants.find((item) => item.id === variantId);
    if (variant && variant.stock === 0) {
      toast.error("That option is out of stock. Pick another one.");
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-neutral-900">Options</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {variants.map((variant) => {
            const isActive = variant.id === selected;
            const soldOut = variant.stock === 0;
            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => choose(variant.id)}
                aria-pressed={isActive}
                className={
                  isActive
                    ? "border-brand-700 bg-brand-50 text-brand-800 rounded-xl border-2 px-3 py-2 text-sm font-semibold"
                    : "hover:border-brand-300 rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700"
                }
              >
                {variant.name}
                <span className="ml-2 text-xs font-normal text-neutral-500">
                  {soldOut ? "out of stock" : `${variant.stock} left`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {active ? (
        <p className="text-sm text-neutral-700">
          {formatPesewas(price)} each
          {active.priceDeltaPesewas !== 0 ? (
            <span className="ml-2 text-xs text-neutral-500">
              {active.priceDeltaPesewas > 0 ? "surcharge" : "reduced"}
            </span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
