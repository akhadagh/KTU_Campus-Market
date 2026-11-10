import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a Campus Market password reset.",
};

export default function ForgotPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Reset your password
      </h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        Enter the email address associated with your account.
      </p>

      <Alert variant="info" title="Email delivery pending" className="mt-6">
        Password recovery needs an email provider. No reset email is sent yet — this form will go
        live as soon as one is connected.
      </Alert>

      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
