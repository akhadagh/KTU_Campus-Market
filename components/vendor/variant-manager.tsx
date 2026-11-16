"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface VariantRow {
  id: string;
  name: string;
  sku: string | null;
  priceDeltaPesewas: number;
  stock: number;
  isActive: boolean;
}

export function VariantManager({
  productId,
  variants,
  basePriceCedis,
}: {
  productId: string;
  variants: VariantRow[];
  basePriceCedis: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", stock: "1", priceDeltaCedis: "0", sku: "" });
  const [pending, setPending] = useState<string | null>(null);

  async function create() {
    if (form.name.trim().length < 1) {
      toast.error('Give the option a name, for example "Large" or "128 GB"');
      return;
    }
    setPending("create");
    try {
      const res = await fetch(`/api/v1/vendor/products/${productId}/variants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          stock: Number(form.stock),
          priceDeltaCedis: Number(form.priceDeltaCedis) || 0,
          sku: form.sku.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not add the option");
        return;
      }
      toast.success("Option added");
      setForm({ name: "", stock: "1", priceDeltaCedis: "0", sku: "" });
      setOpen(false);
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(null);
    }
  }

  async function updateStock(variant: VariantRow, stock: number) {
    setPending(variant.id);
    try {
      const res = await fetch(`/api/v1/vendor/products/${productId}/variants/${variant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stock }),
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
      setPending(null);
    }
  }

  async function remove(variant: VariantRow) {
    setPending(variant.id);
    try {
      const res = await fetch(`/api/v1/vendor/products/${productId}/variants/${variant.id}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not remove the option");
        return;
      }
      toast.success("Option removed");
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(null);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">Options and variations</h3>
          <p className="mt-1 text-xs text-neutral-500">
            Sizes, colours or capacities. Each option keeps its own stock and can carry a price
            adjustment.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => setOpen((value) => !value)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add option
        </Button>
      </div>

      {open ? (
        <div className="mt-4 grid gap-3 rounded-xl border border-neutral-200 p-4 sm:grid-cols-4">
          <div>
            <label
              htmlFor="variant-name"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Option name
            </label>
            <Input
              id="variant-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Large, 128 GB, Black"
            />
          </div>
          <div>
            <label
              htmlFor="variant-stock"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Stock
            </label>
            <Input
              id="variant-stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={(event) => setForm({ ...form, stock: event.target.value })}
            />
          </div>
          <div>
            <label
              htmlFor="variant-price"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              Price change (GH₵)
            </label>
            <Input
              id="variant-price"
              type="number"
              step="0.5"
              value={form.priceDeltaCedis}
              onChange={(event) => setForm({ ...form, priceDeltaCedis: event.target.value })}
            />
          </div>
          <div>
            <label
              htmlFor="variant-sku"
              className="mb-1 block text-xs font-medium text-neutral-700"
            >
              SKU (optional)
            </label>
            <Input
              id="variant-sku"
              value={form.sku}
              onChange={(event) => setForm({ ...form, sku: event.target.value })}
            />
          </div>
          <div className="sm:col-span-4">
            <Button size="sm" onClick={create} disabled={pending !== null}>
              {pending === "create" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : null}
              Save option
            </Button>
          </div>
        </div>
      ) : null}

      {variants.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-600">
          No options yet. Add them when a listing comes in different sizes, colours or capacities.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {variants.map((variant) => (
            <li
              key={variant.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-neutral-900">{variant.name}</p>
                <p className="text-xs text-neutral-500">
                  {formatPrice(basePriceCedis, variant.priceDeltaPesewas)}
                  {variant.sku ? ` · SKU ${variant.sku}` : ""}
                </p>
              </div>
              <div className="w-24">
                <label htmlFor={`stock-${variant.id}`} className="sr-only">
                  Stock for {variant.name}
                </label>
                <Input
                  id={`stock-${variant.id}`}
                  type="number"
                  min="0"
                  defaultValue={variant.stock}
                  onBlur={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isInteger(value) && value !== variant.stock) {
                      void updateStock(variant, value);
                    }
                  }}
                  disabled={pending === variant.id}
                  className="h-9"
                />
              </div>
              <button
                type="button"
                onClick={() => remove(variant)}
                disabled={pending === variant.id}
                aria-label={`Remove ${variant.name}`}
                className="focus-visible:ring-brand-500/30 grid h-9 w-9 place-items-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
              >
                {pending === variant.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function formatPrice(baseCedis: number, deltaPesewas: number): string {
  const price = baseCedis + deltaPesewas / 100;
  return `GH₵${price.toFixed(2)}`;
}
