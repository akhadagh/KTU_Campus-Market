"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function MarkNotificationsReadButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function markAll() {
    setPending(true);
    try {
      const res = await fetch("/api/v1/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not mark notifications as read");
        return;
      }
      toast.success("Notifications marked as read");
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button variant="outline" onClick={markAll} disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <CheckCheck className="h-4 w-4" aria-hidden="true" />
      )}
      Mark all as read
    </Button>
  );
}
