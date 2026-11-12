"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function OrderSupportActions({
  orderId,
  maxRefundCedis,
  canRefund,
  canDispute,
}: {
  orderId: string;
  maxRefundCedis: number;
  canRefund: boolean;
  canDispute: boolean;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<"refund" | "dispute" | null>(null);
  const [amount, setAmount] = useState(String(maxRefundCedis));
  const [reason, setReason] = useState("");
  const [category, setCategory] = useState("NOT_AS_DESCRIBED");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  async function requestRefund() {
    setPending(true);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountCedis: Number(amount), reason: reason.trim() }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not request the refund");
        return;
      }
      toast.success("Refund requested", {
        description: "Our team will review it and confirm before anything is refunded.",
      });
      setPanel(null);
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  async function raiseDispute() {
    setPending(true);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/disputes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description: description.trim(),
          evidenceLinks: [],
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not raise the dispute");
        return;
      }
      toast.success("Dispute raised", {
        description: "Our team will investigate and reply to you here.",
      });
      setPanel(null);
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  if (!canRefund && !canDispute) return null;

  return (
    <CardShell>
      <div className="flex flex-wrap gap-3">
        {canRefund ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPanel(panel === "refund" ? null : "refund")}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Request a refund
          </Button>
        ) : null}
        {canDispute ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPanel(panel === "dispute" ? null : "dispute")}
          >
            <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
            Report a problem
          </Button>
        ) : null}
      </div>

      {panel === "refund" ? (
        <div className="mt-4 rounded-xl border border-neutral-200 p-4">
          <p className="text-sm font-semibold text-neutral-900">Request a refund</p>
          <p className="mt-1 text-xs text-neutral-600">
            You can request up to GH₵{maxRefundCedis.toFixed(2)}. Nothing is refunded until the team
            approves it and the payment provider confirms it.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[10rem_1fr]">
            <div>
              <label
                htmlFor="refund-amount"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Amount (GH₵)
              </label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                min="1"
                max={maxRefundCedis}
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div>
              <label
                htmlFor="refund-reason"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Reason
              </label>
              <Input
                id="refund-reason"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Why are you requesting a refund?"
              />
            </div>
          </div>
          <Button size="sm" className="mt-3" onClick={requestRefund} disabled={pending}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
            Send refund request
          </Button>
        </div>
      ) : null}

      {panel === "dispute" ? (
        <div className="mt-4 rounded-xl border border-neutral-200 p-4">
          <p className="text-sm font-semibold text-neutral-900">Report a problem</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[14rem_1fr]">
            <div>
              <label
                htmlFor="dispute-category"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                What went wrong?
              </label>
              <Select
                id="dispute-category"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="NOT_RECEIVED">Item not received</option>
                <option value="NOT_AS_DESCRIBED">Not as described</option>
                <option value="PAYMENT_ISSUE">Payment issue</option>
                <option value="QUALITY_ISSUE">Quality problem</option>
                <option value="LATE_DELIVERY">Late delivery</option>
                <option value="OTHER">Other</option>
              </Select>
            </div>
            <div>
              <label
                htmlFor="dispute-description"
                className="mb-1 block text-xs font-medium text-neutral-700"
              >
                Describe the problem
              </label>
              <Textarea
                id="dispute-description"
                className="min-h-20"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="At least 20 characters so our team can help quickly."
              />
            </div>
          </div>
          <Button size="sm" className="mt-3" onClick={raiseDispute} disabled={pending}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
            Send report
          </Button>
        </div>
      ) : null}
    </CardShell>
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-neutral-200 bg-white p-4">{children}</div>;
}
