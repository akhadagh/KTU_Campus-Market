"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CartLine } from "@/lib/cart";
import { formatPesewas } from "@/lib/money";

export function CartView({
  items,
  subtotalPesewas,
  vendorCount,
}: {
  items: CartLine[];
  subtotalPesewas: number;
  vendorCount: number;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function update(itemId: string, quantity: number) {
    setPending(itemId);
    try {
      const res = await fetch(`/api/v1/cart/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not update the cart");
        return;
      }
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(null);
    }
  }

  async function remove(itemId: string) {
    setPending(itemId);
    try {
      const res = await fetch(`/api/v1/cart/items/${itemId}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not remove the item");
        return;
      }
      toast.success("Item removed");
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(null);
    }
  }

  const grouped = items.reduce<Record<string, CartLine[]>>((groups, item) => {
    groups[item.vendorName] = [...(groups[item.vendorName] ?? []), item];
    return groups;
  }, {});

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
      <div className="space-y-6">
        {Object.entries(grouped).map(([vendorName, lines]) => (
          <Card key={vendorName} className="p-5">
            <p className="text-sm font-semibold text-neutral-900">
              Sold by {vendorName}
              {vendorCount > 1 ? " · shipped separately" : ""}
            </p>
            <ul className="mt-4 divide-y divide-neutral-100">
              {lines.map((line) => (
                <li key={line.id} className="flex flex-wrap items-center gap-4 py-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {line.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={line.imageUrl}
                        alt={line.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/products/${line.productSlug}`}
                      className="text-sm font-medium text-neutral-900 hover:underline"
                    >
                      {line.productName}
                    </Link>
                    <p className="text-xs text-neutral-500">
                      {formatPesewas(line.unitPricePesewas)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => update(line.id, Math.max(1, line.quantity - 1))}
                      disabled={pending === line.id || line.quantity <= 1}
                      aria-label={`Decrease quantity of ${line.productName}`}
                      className="focus-visible:ring-brand-500/30 grid h-8 w-8 place-items-center rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-neutral-900">
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => update(line.id, Math.min(line.stock, line.quantity + 1))}
                      disabled={pending === line.id || line.quantity >= line.stock}
                      aria-label={`Increase quantity of ${line.productName}`}
                      className="focus-visible:ring-brand-500/30 grid h-8 w-8 place-items-center rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-50 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="w-24 text-right">
                    <p className="text-sm font-semibold text-neutral-900">
                      {formatPesewas(line.lineTotalPesewas)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(line.id)}
                    disabled={pending === line.id}
                    aria-label={`Remove ${line.productName} from cart`}
                    className="focus-visible:ring-brand-500/30 grid h-8 w-8 place-items-center rounded-md text-neutral-400 hover:bg-red-50 hover:text-red-600 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-40"
                  >
                    {pending === line.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="h-fit p-5">
        <h2 className="text-sm font-semibold text-neutral-900">Order summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-neutral-600">
            <dt>Subtotal</dt>
            <dd className="text-neutral-900">{formatPesewas(subtotalPesewas)}</dd>
          </div>
          <div className="flex justify-between text-neutral-600">
            <dt>Delivery</dt>
            <dd className="text-neutral-900">Calculated at checkout</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 font-semibold text-neutral-900">
            <dt>Total</dt>
            <dd>{formatPesewas(subtotalPesewas)}</dd>
          </div>
        </dl>
        <Link href="/checkout" className={`${buttonVariants({ size: "lg" })} mt-5 w-full`}>
          Continue to checkout
        </Link>
        <p className="mt-3 text-xs leading-5 text-neutral-500">
          Items from different vendors are split into separate vendor orders so each seller can
          fulfil their part.
        </p>
      </Card>
    </div>
  );
}
