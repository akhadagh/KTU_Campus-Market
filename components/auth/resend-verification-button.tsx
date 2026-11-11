"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ResendVerificationButton() {
  const [pending, setPending] = useState(false);

  async function resend() {
    setPending(true);
    try {
      const res = await fetch("/api/v1/auth/resend-verification", { method: "POST" });
      const json = (await res.json()) as {
        data?: { sent: boolean; alreadyVerified?: boolean; delivery?: string };
        error?: { message?: string };
      };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not send a verification email");
        return;
      }
      if (json.data?.alreadyVerified) {
        toast.info("Your email is already verified.");
        return;
      }
      if (json.data?.delivery === "email") {
        toast.success("Verification email sent", {
          description: "Check your inbox and spam folder.",
        });
        return;
      }
      toast.info("Verification link created, but email delivery is not configured", {
        description:
          "Server email delivery is not configured on this deployment, so no email was sent. The link was written to the server log.",
      });
    } catch {
      toast.error("Could not reach the server", {
        description: "Check your connection and try again.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={resend} disabled={pending}>
      {pending ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Send className="h-4 w-4" aria-hidden="true" />
      )}
      {pending ? "Sending…" : "Resend verification email"}
    </Button>
  );
}
