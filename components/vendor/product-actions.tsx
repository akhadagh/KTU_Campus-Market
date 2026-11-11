"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";

export function ProductActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);

  async function update(target: "DRAFT" | "PENDING_REVIEW" | "ARCHIVED") {
    setPending(target);
    try {
      const res = await fetch(`/api/v1/vendor/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not update the product");
        return;
      }
      const message =
        target === "PENDING_REVIEW"
          ? "Submitted for review"
          : target === "DRAFT"
            ? "Moved to draft"
            : "Product archived";
      toast.success(message);
      router.refresh();
    } catch {
      toast.error("Could not reach the server");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/sell/products/${id}/edit`}
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Edit
      </Link>
      {status === "DRAFT" || status === "REJECTED" ? (
        <Button size="sm" onClick={() => update("PENDING_REVIEW")} disabled={pending !== null}>
          {pending === "PENDING_REVIEW" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Submit for review
        </Button>
      ) : null}
      {status === "ACTIVE" || status === "PENDING_REVIEW" || status === "OUT_OF_STOCK" ? (
        <Button
          size="sm"
          variant="outline"
          onClick={() => update("DRAFT")}
          disabled={pending !== null}
        >
          {pending === "DRAFT" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Unpublish
        </Button>
      ) : null}
      {status !== "ARCHIVED" ? (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => update("ARCHIVED")}
          disabled={pending !== null}
        >
          {pending === "ARCHIVED" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Archive
        </Button>
      ) : null}
    </div>
  );
}
