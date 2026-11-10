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

      <Alert variant="info" title="Reset preview" className="mt-6">
        Password reset tokens and session revocation are implemented in Milestone 3. No password is
        changed yet.
      </Alert>

      <div className="mt-6">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
