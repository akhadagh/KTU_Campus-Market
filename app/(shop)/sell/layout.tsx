import type { Metadata } from "next";
import { VendorDashboard } from "@/components/dashboard/vendor-dashboard";

export const metadata: Metadata = { title: "Seller workspace" };

export default function SellLayout({ children }: { children: React.ReactNode }) {
  return <VendorDashboard>{children}</VendorDashboard>;
}
