import type { Metadata } from "next";
import Link from "next/link";
import { User } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = { title: "My account" };

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="My account"
        description="Manage your profile, verification, preferences, and account security."
      />
      <div className="mt-6">
        <EmptyState
          icon={User}
          title="Account features are being connected"
          description="Registration, login, profiles, and verification are implemented in Milestone 3. The interface currently shows the planned empty state."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/login" className={buttonVariants({ variant: "outline" })}>
                Log in
              </Link>
              <Link href="/register" className={buttonVariants()}>
                Create account
              </Link>
            </div>
          }
        />
      </div>
    </div>
  );
}
