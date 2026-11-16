import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountClosureForm } from "@/components/account/account-closure-form";
import { PageHeader } from "@/components/ui/page-header";
import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const metadata: Metadata = { title: "Close account" };

export default async function CloseAccountPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/close");

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { closureRequestedAt: true, status: true },
  });

  return (
    <div>
      <PageHeader
        title="Close your account"
        description="Deactivate your JUMART account and stop selling or buying on the platform."
      />
      <div className="mt-6">
        <AccountClosureForm
          requestedAt={user.closureRequestedAt ? user.closureRequestedAt.toISOString() : null}
          status={user.status}
        />
      </div>
    </div>
  );
}
