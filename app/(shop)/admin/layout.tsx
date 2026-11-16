import type { Metadata } from "next";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export const metadata: Metadata = { title: "Administration" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminDashboard>{children}</AdminDashboard>;
}
