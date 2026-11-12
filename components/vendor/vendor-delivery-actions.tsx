"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Truck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

const statuses = [
  { value: "PENDING", label: "Preparing dispatch" },
  { value: "ASSIGNED", label: "Rider assigned" },
  { value: "PICKED_UP", label: "Picked up" },
  { value: "IN_TRANSIT", label: "On the way" },
  { value: "DELIVERED", label: "Delivered" },
];

export function VendorDeliveryActions({
  vendorOrderId,
  currentStatus,
  trackingCode,
}: {
  vendorOrderId: string;
  currentStatus: string | null;
  trackingCode: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus ?? "PENDING");
  const [code, setCode] = useState(trackingCode ?? "");
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    try {
      const res = await fetch(`/api/v1/vendor/orders/${vendorOrderId}/delivery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, trackingCode: code.trim() || undefined }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not update the delivery");
        return;
      }
      toast.success("Delivery updated");
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        aria-label="Delivery status"
        className="sm:max-w-[12rem]"
      >
        {statuses.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Input
        value={code}
        onChange={(event) => setCode(event.target.value)}
        placeholder="Tracking code (optional)"
        aria-label="Tracking code"
        className="sm:max-w-[12rem]"
      />
      <Button size="sm" variant="outline" onClick={save} disabled={pending}>
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Truck className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        Update delivery
      </Button>
    </div>
  );
}
