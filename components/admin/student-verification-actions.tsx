"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function StudentVerificationActions({ verificationId }: { verificationId: string }) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function decide(decision: "APPROVED" | "REJECTED") {
    setPending(decision);
    try {
      const res = await fetch(`/api/v1/admin/student-verifications/${verificationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, notes: notes.trim() || undefined }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not review the request");
        return;
      }
      toast.success(decision === "APPROVED" ? "Student verified" : "Request rejected");
      setNotes("");
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
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Notes for the student"
        aria-label="Notes for the student"
        className="sm:max-w-xs"
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => decide("APPROVED")} disabled={pending !== null}>
          {pending === "APPROVED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Approve
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => decide("REJECTED")}
          disabled={pending !== null}
        >
          {pending === "REJECTED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Reject
        </Button>
      </div>
    </div>
  );
}
