import type { Metadata } from "next";
import { CustomerDashboard } from "@/components/dashboard/customer-dashboard";

export const metadata: Metadata = { title: "My account" };

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return <CustomerDashboard>{children}</CustomerDashboard>;
}
