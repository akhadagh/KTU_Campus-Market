"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function RefundDecisionButtons({ refundId }: { refundId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function decide(decision: "APPROVE" | "REJECT") {
    setPending(decision);
    try {
      const res = await fetch(`/api/v1/admin/refunds/${refundId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: note.trim() || undefined }),
      });
      const json = (await res.json()) as {
        error?: { message?: string };
        data?: { refund?: { status: string } };
      };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not process the refund");
        return;
      }
      toast.success(
        decision === "APPROVE"
          ? "Refund approved and sent to the payment provider"
          : "Refund request rejected",
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
        placeholder="Note to the buyer"
        aria-label="Note to the buyer"
        className="sm:max-w-xs"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => decide("APPROVE")} disabled={pending !== null}>
          {pending === "APPROVE" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Approve refund
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
      </div>
    </div>
  );
}
