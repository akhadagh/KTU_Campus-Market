"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UserStatusActions({ userId, status }: { userId: string; status: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  async function update(next: "ACTIVE" | "SUSPENDED") {
    setPending(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, reason: reason.trim() || undefined }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not update the account");
        return;
      }
      toast.success(
        next === "ACTIVE" ? "Account reactivated" : "Account suspended and signed out everywhere",
      );
      setReason("");
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Reason (optional)"
        aria-label="Reason"
        className="sm:max-w-[12rem]"
      />
      {status === "ACTIVE" ? (
        <Button size="sm" variant="outline" onClick={() => update("SUSPENDED")} disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Suspend
        </Button>
      ) : (
        <Button size="sm" onClick={() => update("ACTIVE")} disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Reactivate
        </Button>
      )}
    </div>
  );
}
