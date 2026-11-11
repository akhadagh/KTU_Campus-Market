"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReviewActions({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function decide(decision: "APPROVE" | "REJECT" | "REMOVE") {
    setPending(decision);
    try {
      const res = await fetch(`/api/v1/admin/reviews/${reviewId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: note.trim() || undefined }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not review the review");
        return;
      }
      toast.success(
        decision === "APPROVE"
          ? "Review published"
          : decision === "REJECT"
            ? "Review rejected"
            : "Review removed",
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
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => decide("APPROVE")} disabled={pending !== null}>
          {pending === "APPROVE" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Publish
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => decide("REJECT")}
          disabled={pending !== null}
        >
          {pending === "REJECT" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Reject
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => decide("REMOVE")}
          disabled={pending !== null}
        >
          {pending === "REMOVE" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Remove
        </Button>
      </div>
    </div>
  );
}

export function ReviewRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-1 text-sm text-amber-600">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
      {rating}/5
    </span>
  );
}
