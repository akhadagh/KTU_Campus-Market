"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { formatPesewas } from "@/lib/money";

export function AddToCartButton({
  productId,
  productName,
  pricePesewas,
  quantity,
  vendorName,
}: {
  productId: string;
  productName: string;
  pricePesewas: number;
  quantity: number;
  vendorName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [added, setAdded] = useState(false);
  const soldOut = quantity < 1;

  async function add() {
    setPending(true);
    try {
      const res = await fetch("/api/v1/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not add to cart");
        return;
      }
      setAdded(true);
      toast.success("Added to cart", {
        description: `${productName} · ${formatPesewas(pricePesewas)} · ${vendorName}`,
      });
      router.refresh();
    } catch {
      toast.error("Could not reach the server", {
        description: "Check your connection and try again.",
      });
    } finally {
      setPending(false);
    }
  }

  if (soldOut) {
    return (
      <Button size="lg" disabled>
        Out of stock
      </Button>
    );
  }

  return (
    <Button size="lg" onClick={add} disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      )}
      {added ? "Added — add another" : "Add to cart"}
    </Button>
  );
}
