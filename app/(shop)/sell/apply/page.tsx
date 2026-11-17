import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { VendorApplicationForm } from "@/components/vendor/vendor-application-form";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Apply to sell",
  description: "Apply for a vendor store on Campus Market.",
};

export default async function VendorApplyPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/sell/apply");

  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
    select: { status: true, verificationStatus: true, storeName: true },
  });
  if (vendor?.status === "ACTIVE") redirect("/sell/dashboard");
  if (vendor && !(vendor.status === "CLOSED" && vendor.verificationStatus === "REJECTED")) {
    redirect("/sell/pending");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Apply for a vendor store"
        description="Tell buyers who you are and what you sell. An administrator reviews every application."
      />
      <Card className="mt-6 p-6">
        {!session.user.emailVerifiedAt ? (
          <Alert variant="warning" title="Your email is not verified" className="mb-5">
            You can apply now, but verified accounts are reviewed faster. Verify your email from
            your account page.
          </Alert>
        ) : null}
        <VendorApplicationForm defaultPhone={session.user.phone ?? undefined} />
      </Card>
    </div>
  );
}
