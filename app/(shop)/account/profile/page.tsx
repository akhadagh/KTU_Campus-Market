import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountProfileForm } from "@/components/account/account-profile-form";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Profile & security" };

export default async function AccountProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/profile");

  const preference = await prisma.userPreference.findUnique({
    where: { userId: session.user.id },
    select: {
      notificationPrefsJson: true,
      personalizationEnabled: true,
      locale: true,
      currency: true,
    },
  });

  const prefs = (preference?.notificationPrefsJson ?? {}) as {
    orders?: boolean;
    messages?: boolean;
    promotions?: boolean;
  };

  return (
    <div>
      <PageHeader
        title="Profile & security"
        description="Keep your details current and control how we contact you."
      />
      <div className="mt-6">
        <AccountProfileForm
          user={{
            fullName: session.user.fullName,
            email: session.user.email,
            phone: session.user.phone ?? "",
            emailVerified: Boolean(session.user.emailVerifiedAt),
          }}
          preferences={{
            orders: prefs.orders ?? true,
            messages: prefs.messages ?? true,
            promotions: prefs.promotions ?? false,
            personalization: preference?.personalizationEnabled ?? true,
          }}
        />
      </div>
    </div>
  );
}
