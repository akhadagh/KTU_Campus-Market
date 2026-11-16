import type { Metadata } from "next";
import { StoreSettingsForm } from "@/components/vendor/store-settings-form";
import { PageHeader } from "@/components/ui/page-header";
import { requireVendor } from "@/lib/auth/rbac";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Store settings" };

export default async function VendorStorePage() {
  const auth = await requireVendor();
  const store = await prisma.vendorProfile.findUniqueOrThrow({
    where: { id: auth.vendorId },
    select: {
      storeName: true,
      description: true,
      phone: true,
      whatsapp: true,
      businessCategory: true,
      pickupAvailable: true,
      deliveryAvailable: true,
      logoUrl: true,
      bannerUrl: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Store settings"
        description="How your store appears to students and how they can reach you."
      />
      <div className="mt-6">
        <StoreSettingsForm store={store} />
      </div>
    </div>
  );
}
