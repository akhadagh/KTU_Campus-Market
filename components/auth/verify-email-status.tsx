"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

type State = "loading" | "success" | "error" | "missing";

export function VerifyEmailStatus({ token }: { token?: string }) {
  const [state, setState] = useState<State>(token ? "loading" : "missing");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/v1/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = (await res.json()) as { error?: { message?: string } };
        if (cancelled) return;
        if (res.ok) {
          setState("success");
        } else {
          setMessage(json.error?.message ?? "This verification link could not be used.");
          setState("error");
        }
      } catch {
        if (cancelled) return;
        setMessage("Could not reach the server. Check your connection and try again.");
        setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (state === "loading") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-600">
        <Loader2 className="text-brand-600 h-5 w-5 animate-spin" aria-hidden="true" />
        Verifying your email address…
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <div className="flex items-center gap-2 text-emerald-800">
          <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
          <p className="font-medium">Email verified</p>
        </div>
        <p className="mt-2 text-sm text-emerald-800">
          Your account is now verified. You can use every part of Campus Market that does not
          require vendor approval.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/account" className={buttonVariants()}>
            Go to my account
          </Link>
          <Link href="/marketplace" className={buttonVariants({ variant: "outline" })}>
            Browse the marketplace
          </Link>
        </div>
      </div>
    );
  }

  if (state === "missing") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-2 text-amber-800">
          <MailWarning className="h-5 w-5" aria-hidden="true" />
          <p className="font-medium">Verification link is missing</p>
        </div>
        <p className="mt-2 text-sm text-amber-800">
          Open the verification link from your email, or request a new link from your account page.
        </p>
        <div className="mt-4">
          <Link href="/account" className={buttonVariants({ variant: "outline" })}>
            Open my account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <div className="flex items-center gap-2 text-red-800">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
        <p className="font-medium">Verification failed</p>
      </div>
      <p className="mt-2 text-sm text-red-800">{message}</p>
      <div className="mt-4">
        <Link href="/account" className={buttonVariants({ variant: "outline" })}>
          Request a new link
        </Link>
      </div>
    </div>
  );
}
