import { CustomerDashboard } from "@/components/dashboard/customer-dashboard";

export default function CustomerGroupLayout({ children }: { children: React.ReactNode }) {
  return <CustomerDashboard>{children}</CustomerDashboard>;
}
