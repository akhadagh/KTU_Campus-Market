import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new Campus Market password.",
};

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Choose a new password
      </h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        Use a strong password you do not reuse on another site.
      </p>

      <Alert variant="info" title="Email delivery pending" className="mt-6">
        Reset links are delivered by email. Until an email provider is connected, no reset link is
        issued and no password is changed.
      </Alert>

      <div className="mt-6">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
