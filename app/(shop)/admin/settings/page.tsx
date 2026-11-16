import type { Metadata } from "next";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { PlatformSettingsForm } from "@/components/admin/platform-settings-form";
import { PERMISSION, requirePermission } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Platform settings" };

export default async function AdminSettingsPage() {
  await requirePermission(PERMISSION.SETTINGS_MANAGE);

  const settings = await prisma.platformSetting.findMany({
    orderBy: { key: "asc" },
    select: { key: true, valueJson: true, updatedAt: true },
  });

  const values = Object.fromEntries(
    settings.map((setting) => [setting.key, setting.valueJson]),
  ) as Record<string, unknown>;

  return (
    <div>
      <PageHeader
        title="Platform settings"
        description="Operational settings for the marketplace. Every change is audit-logged."
      />
      <div className="mt-6">
        <PlatformSettingsForm
          initialValues={{
            marketplaceName: (values["marketplace.name"] as string) ?? "JUMART",
            tagline: (values["marketplace.tagline"] as string) ?? "Your Campus. Your Marketplace.",
            supportEmail: (values["marketplace.supportEmail"] as string) ?? "",
            platformFeePercent:
              typeof values["marketplace.platformFeePercent"] === "number"
                ? (values["marketplace.platformFeePercent"] as number)
                : 5,
            refundWindowDays:
              typeof values["marketplace.refundWindowDays"] === "number"
                ? (values["marketplace.refundWindowDays"] as number)
                : 14,
            paymentWindowMinutes:
              typeof values["marketplace.paymentWindowMinutes"] === "number"
                ? (values["marketplace.paymentWindowMinutes"] as number)
                : 30,
            maintenanceMode: values["marketplace.maintenanceMode"] === true,
          }}
        />
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs text-neutral-500">
        <Settings className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Settings are stored in the platform_settings table and applied to the marketplace
        configuration. Payment, refund and delivery windows are enforced by the server.
      </p>
    </div>
  );
}
