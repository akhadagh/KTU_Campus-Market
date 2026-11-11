"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { JumartMark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <JumartMark className="h-12 w-12" />
      <div className="mt-6 grid h-14 w-14 place-items-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="h-7 w-7" aria-hidden="true" />
      </div>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-neutral-900">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-neutral-600">
        The page could not be loaded. Try again. If the problem continues, contact the JUMART team
        from your messages page.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-neutral-500">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" onClick={() => router.push("/")}>
          Go home
        </Button>
        <Button variant="ghost" onClick={() => router.push("/messages")}>
          Contact JUMART
        </Button>
      </div>
    </div>
  );
}
