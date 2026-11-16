"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export function AccountClosureForm({
  requestedAt,
  status,
}: {
  requestedAt: string | null;
  status: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (reason.trim().length < 10) {
      toast.error("Tell us briefly why you are closing your account");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/v1/users/me/closure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not submit the request");
        return;
      }
      toast.success("Account deactivated", {
        description: "Our team will confirm and delete your personal data.",
      });
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(false);
    }
  }

  if (requestedAt) {
    return (
      <Card className="border-amber-200 bg-amber-50 p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              Your account has been deactivated
            </p>
            <p className="mt-1 text-sm text-amber-800">
              Requested on{" "}
              {new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(
                new Date(requestedAt),
              )}
              . The JUMART team will confirm the request and remove your personal data in line with
              the privacy policy.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <p className="text-sm text-neutral-600">
        Closing your account signs you out everywhere and stops you from buying or selling. Open
        orders must be completed or cancelled first. Your order history is retained for legal and
        accounting reasons.
      </p>
      <label
        htmlFor="closure-reason"
        className="mt-4 mb-1 block text-xs font-medium text-neutral-700"
      >
        Why are you closing your account?
      </label>
      <Textarea
        id="closure-reason"
        className="min-h-24"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder="Tell us briefly so we can improve."
      />
      <Button
        className="mt-4"
        variant="outline"
        onClick={submit}
        disabled={pending || status !== "ACTIVE"}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        Request account closure
      </Button>
      {status !== "ACTIVE" ? (
        <p className="mt-2 text-xs text-neutral-500">
          This account is {status.toLowerCase().replaceAll("_", " ")} and cannot be closed here.
        </p>
      ) : null}
    </Card>
  );
}
