"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function DisputeDecisionForm({ disputeId }: { disputeId: string }) {
  const router = useRouter();
  const [decision, setDecision] = useState("UNDER_REVIEW");
  const [resolution, setResolution] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (resolution.trim().length < 5) {
      toast.error("Add a short resolution note");
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/v1/admin/disputes/${disputeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, resolution: resolution.trim() }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not resolve the dispute");
        return;
      }
      toast.success("Dispute updated");
      setResolution("");
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <Select
        value={decision}
        onChange={(event) => setDecision(event.target.value)}
        aria-label="Decision"
        className="sm:max-w-[13rem]"
      >
        <option value="UNDER_REVIEW">Under review</option>
        <option value="RESOLVED_BUYER">Resolved for buyer</option>
        <option value="RESOLVED_VENDOR">Resolved for vendor</option>
        <option value="RESOLVED_PARTIAL">Partially resolved</option>
        <option value="CLOSED">Closed</option>
      </Select>
      <Textarea
        value={resolution}
        onChange={(event) => setResolution(event.target.value)}
        placeholder="Resolution note shown to the buyer and vendor"
        aria-label="Resolution note"
        className="min-h-16"
      />
      <Button onClick={submit} disabled={pending} className="sm:mt-1">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        Save
      </Button>
    </div>
  );
}
