import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeCheck, Mail, Package, ShieldCheck, User, Heart } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "My account" };

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GH", { dateStyle: "medium" }).format(date);

export default async function AccountPage() {
  const auth = await getSession();
  if (!auth) redirect("/login?next=/account");
  const { user } = auth;

  const details = [
    { icon: User, label: "Full name", value: user.fullName },
    { icon: Mail, label: "Email", value: user.email },
    { icon: ShieldCheck, label: "Phone", value: user.phone ?? "Not provided" },
    { icon: Package, label: "Member since", value: formatDate(user.createdAt) },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="My account"
        description="Manage your profile, verification, preferences, and account security."
      />

      <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-brand-50 text-brand-700 grid h-14 w-14 place-items-center rounded-full text-lg font-semibold">
              {user.fullName
                .split(" ")
                .slice(0, 2)
                .map((part) => part.charAt(0).toUpperCase())
                .join("")}
            </div>
            <div>
              <p className="text-lg font-semibold text-neutral-900">{user.fullName}</p>
              <p className="text-sm text-neutral-600">{user.email}</p>
            </div>
          </div>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
              user.emailVerifiedAt ? "bg-accent-50 text-accent-700" : "bg-amber-50 text-amber-700",
            )}
          >
            <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {user.emailVerifiedAt ? "Email verified" : "Email not verified"}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {details.map((detail) => {
            const Icon = detail.icon;
            return (
              <div key={detail.label} className="flex items-start gap-3">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
                <div>
                  <dt className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                    {detail.label}
                  </dt>
                  <dd className="text-sm text-neutral-900">{detail.value}</dd>
                </div>
              </div>
            );
          })}
        </dl>

        {!user.emailVerifiedAt ? (
          <p className="mt-6 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Email verification will activate as soon as an email provider is connected. Until then
            your account is usable but unverified.
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/orders" className={buttonVariants({ variant: "outline" })}>
            My orders
          </Link>
          <Link href="/wishlist" className={buttonVariants({ variant: "outline" })}>
            <Heart className="h-4 w-4" aria-hidden="true" />
            Wishlist
          </Link>
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
