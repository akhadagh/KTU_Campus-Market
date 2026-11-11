"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AddToWishlistButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);

  async function toggle() {
    setPending(true);
    try {
      const res = await fetch("/api/v1/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const json = (await res.json()) as {
        data?: { saved?: boolean };
        error?: { message?: string };
      };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not update your wishlist");
        return;
      }
      const isSaved = Boolean(json.data?.saved);
      setSaved(isSaved);
      toast.success(isSaved ? "Saved to wishlist" : "Removed from wishlist", {
        description: productName,
      });
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button size="lg" variant="outline" onClick={toggle} disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Heart
          className={saved ? "fill-brand-700 text-brand-700 h-4 w-4" : "h-4 w-4"}
          aria-hidden="true"
        />
      )}
      {saved ? "Saved" : "Save for later"}
    </Button>
  );
}
