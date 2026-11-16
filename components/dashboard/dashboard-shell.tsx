import type { ReactNode } from "react";
import { DashboardSidebar, type SidebarItem } from "@/components/dashboard/dashboard-sidebar";

export function DashboardShell({
  title,
  subtitle,
  items,
  accent = "brand",
  children,
}: {
  title: string;
  subtitle?: string;
  items: SidebarItem[];
  accent?: "brand" | "accent";
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <DashboardSidebar title={title} subtitle={subtitle} items={items} accent={accent} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
