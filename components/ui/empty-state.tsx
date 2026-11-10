import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-neutral-100 text-neutral-500">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-base font-semibold text-neutral-900">{title}</h2>
      <p className="mt-1 max-w-md text-sm leading-6 text-neutral-600">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
