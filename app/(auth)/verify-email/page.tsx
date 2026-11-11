import type { Metadata } from "next";
import { VerifyEmailStatus } from "@/components/auth/verify-email-status";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Confirm your Campus Market email address.",
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Verify your email</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        We are confirming the link you opened. This usually takes a moment.
      </p>
      <div className="mt-6">
        <VerifyEmailStatus token={params.token} />
      </div>
    </div>
  );
}
