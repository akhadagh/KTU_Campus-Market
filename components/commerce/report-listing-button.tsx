"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function ReportListingButton({
  targetType,
  targetId,
  targetName,
}: {
  targetType: "PRODUCT" | "VENDOR" | "USER" | "ORDER" | "REVIEW";
  targetId: string;
  targetName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("FAKE_LISTING");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    setPending(true);
    try {
      const res = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, description: description.trim() }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not submit the report");
        return;
      }
      toast.success("Report submitted", {
        description: "Our moderation team will review it.",
      });
      setOpen(false);
      setDescription("");
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Flag className="h-4 w-4" aria-hidden="true" />
        Report {targetType === "PRODUCT" ? "this listing" : "this profile"}
      </Button>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-medium text-red-800">Report {targetName}</p>
      <div className="mt-2">
        <label htmlFor="report-reason" className="block text-xs font-medium text-red-800">
          Reason
        </label>
        <Select
          id="report-reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="mt-1"
        >
          {[
            { value: "FAKE_LISTING", label: "Fake listing" },
            { value: "COUNTERFEIT", label: "Counterfeit goods" },
            { value: "MISLEADING_DESCRIPTION", label: "Misleading description" },
            { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate content" },
            { value: "HARASSMENT", label: "Harassment" },
            { value: "FRAUD", label: "Fraud or scam" },
            { value: "OTHER", label: "Other" },
          ].map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="mt-3">
        <label htmlFor="report-description" className="block text-xs font-medium text-red-800">
          What happened?
        </label>
        <Input
          id="report-description"
          className="mt-1"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="At least 10 characters"
        />
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button size="sm" onClick={submit} disabled={pending}>
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
          Submit report
        </Button>
      </div>
    </div>
  );
}
