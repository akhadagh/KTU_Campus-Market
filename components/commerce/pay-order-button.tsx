"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PayOrderButton({ orderId, label }: { orderId: string; label?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function pay() {
    setPending(true);
    try {
      const res = await fetch("/api/v1/payments/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const json = (await res.json()) as {
        data?: { authorizationUrl?: string };
        error?: { message?: string; code?: string };
      };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not start the payment", {
          description:
            json.error?.code === "PROVIDER_UNAVAILABLE"
              ? "Online payments are not configured on this deployment."
              : undefined,
        });
        return;
      }
      if (json.data?.authorizationUrl) {
        window.location.href = json.data.authorizationUrl;
        return;
      }
      toast.error("Payment could not start. Try again.");
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
      router.refresh();
    }
  }

  return (
    <Button size="sm" onClick={pay} disabled={pending}>
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
      {label ?? "Pay now"}
    </Button>
  );
}
