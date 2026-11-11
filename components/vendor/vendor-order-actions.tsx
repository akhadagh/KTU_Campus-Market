"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const nextStatuses: Record<
  string,
  { value: string; label: string; variant?: "outline" | "ghost" }[]
> = {
  PENDING: [
    { value: "ACCEPTED", label: "Accept" },
    { value: "CANCELLED", label: "Cancel", variant: "ghost" },
  ],
  ACCEPTED: [
    { value: "PREPARING", label: "Start preparing" },
    { value: "CANCELLED", label: "Cancel", variant: "ghost" },
  ],
  PREPARING: [
    { value: "READY_FOR_PICKUP", label: "Ready for pickup" },
    { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
    { value: "CANCELLED", label: "Cancel", variant: "ghost" },
  ],
  READY_FOR_PICKUP: [
    { value: "OUT_FOR_DELIVERY", label: "Out for delivery" },
    { value: "DELIVERED", label: "Mark delivered" },
    { value: "CANCELLED", label: "Cancel", variant: "ghost" },
  ],
  OUT_FOR_DELIVERY: [
    { value: "DELIVERED", label: "Mark delivered" },
    { value: "CANCELLED", label: "Cancel", variant: "ghost" },
  ],
};

export function VendorOrderActions({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const options = nextStatuses[status] ?? [];

  async function update(target: string) {
    setPending(target);
    try {
      const res = await fetch(`/api/v1/vendor/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not update the order");
        return;
      }
      toast.success("Order updated", {
        description: target.replaceAll("_", " ").toLowerCase(),
      });
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(null);
    }
  }

  if (options.length === 0) {
    return <span className="text-xs text-neutral-500">No further action</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option.value}
          size="sm"
          variant={option.variant ?? "outline"}
          onClick={() => update(option.value)}
          disabled={pending !== null}
        >
          {pending === option.value ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
          ) : null}
          {option.label}
        </Button>
      ))}
    </div>
  );
}
