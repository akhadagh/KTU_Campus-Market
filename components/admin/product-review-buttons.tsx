"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProductReviewButtons({ productId, status }: { productId: string; status: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function review(decision: "APPROVE" | "REJECT" | "DELIST") {
    setPending(decision);
    try {
      const res = await fetch(`/api/v1/admin/products/${productId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: note.trim() || undefined }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not review the listing");
        return;
      }
      toast.success(
        decision === "APPROVE"
          ? "Listing approved"
          : decision === "REJECT"
            ? "Listing rejected"
            : "Listing delisted",
      );
      setNote("");
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Moderation note"
        aria-label="Moderation note"
        className="sm:max-w-xs"
      />
      <div className="flex gap-2">
        {status === "ACTIVE" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => review("DELIST")}
            disabled={pending !== null}
          >
            {pending === "DELIST" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Delist
          </Button>
        ) : (
          <>
            <Button size="sm" onClick={() => review("APPROVE")} disabled={pending !== null}>
              {pending === "APPROVE" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => review("REJECT")}
              disabled={pending !== null}
            >
              {pending === "REJECT" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Reject
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
