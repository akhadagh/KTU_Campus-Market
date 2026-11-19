"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CancelOrderButton({
  orderId,
  orderNumber,
  disabled,
}: {
  orderId: string;
  orderNumber: string;
  disabled: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  async function cancel(reason: string) {
    setPending(true);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not cancel the order");
        return;
      }
      toast.success(`Order ${orderNumber} cancelled`);
      setConfirming(false);
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setConfirming(true)} disabled={disabled}>
        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
        Cancel order
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 p-3">
      <p className="text-sm text-neutral-700">Why are you cancelling?</p>
      <input
        type="text"
        id="cancel-reason"
        placeholder="Optional reason"
        aria-label="Cancellation reason"
        className="focus-visible:border-brand-500 h-9 min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
      />
      <Button
        size="sm"
        onClick={() => {
          const input = document.getElementById("cancel-reason") as HTMLInputElement | null;
          void cancel(input?.value ?? "");
        }}
        disabled={pending}
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
        Confirm cancellation
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
        Keep order
      </Button>
    </div>
  );
}
