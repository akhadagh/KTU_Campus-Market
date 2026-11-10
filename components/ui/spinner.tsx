import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2 className={cn("text-brand-700 h-5 w-5 animate-spin", className)} aria-hidden="true" />
  );
}

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-neutral-600">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}
