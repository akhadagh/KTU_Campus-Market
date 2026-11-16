import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddressManager } from "@/components/account/address-manager";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Delivery addresses" };

export default async function AddressesPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/addresses");

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      label: true,
      recipientName: true,
      phone: true,
      address: true,
      campus: true,
      instructions: true,
      isDefault: true,
    },
  });

  return (
    <div>
      <PageHeader
        title="Delivery addresses"
        description="Addresses you can select when you check out. Only you can see them."
      />
      <div className="mt-6">
        <AddressManager addresses={addresses} />
      </div>
    </div>
  );
}
