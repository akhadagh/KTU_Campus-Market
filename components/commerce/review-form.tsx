"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReviewForm({
  orderItemId,
  productName,
}: {
  orderItemId: string;
  productName: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    try {
      const res = await fetch("/api/v1/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderItemId, rating, comment: comment.trim() || undefined }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not submit the review");
        return;
      }
      toast.success("Review submitted", {
        description: "A moderator checks reviews before they appear publicly.",
      });
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="rounded-lg border border-neutral-200 p-4">
      <p className="text-sm font-medium text-neutral-900">Rate {productName}</p>
      <div className="mt-2 flex items-center gap-1" role="group" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${value} star${value === 1 ? "" : "s"}`}
            aria-pressed={rating === value}
            className="focus-visible:ring-brand-500/30 rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
          >
            <Star
              className={
                (hovered || rating) >= value
                  ? "h-5 w-5 fill-amber-400 text-amber-400"
                  : "h-5 w-5 text-neutral-300"
              }
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
      <label
        htmlFor={`review-${orderItemId}`}
        className="mt-3 block text-xs font-medium text-neutral-700"
      >
        Comment (optional)
      </label>
      <Textarea
        id={`review-${orderItemId}`}
        className="mt-1 min-h-20"
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        placeholder="What was your experience?"
      />
      <Button size="sm" className="mt-3" onClick={submit} disabled={pending}>
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
        Submit review
      </Button>
    </div>
  );
}
