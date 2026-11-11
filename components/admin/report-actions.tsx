"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, setPending] = useState<string | null>(null);

  async function decide(decision: "IN_REVIEW" | "RESOLVED" | "DISMISSED") {
    setPending(decision);
    try {
      const res = await fetch(`/api/v1/admin/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, note: note.trim() || undefined }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not update the report");
        return;
      }
      toast.success("Report updated");
      setNote("");
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
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Resolution note"
        aria-label="Resolution note"
        className="sm:max-w-xs"
      />
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => decide("IN_REVIEW")}
          disabled={pending !== null}
        >
          {pending === "IN_REVIEW" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Take
        </Button>
        <Button size="sm" onClick={() => decide("RESOLVED")} disabled={pending !== null}>
          {pending === "RESOLVED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Resolve
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => decide("DISMISSED")}
          disabled={pending !== null}
        >
          {pending === "DISMISSED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Dismiss
        </Button>
      </div>
    </div>
  );
}
