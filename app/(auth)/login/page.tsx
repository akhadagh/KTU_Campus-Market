import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your Campus Market account.",
};

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Welcome back</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        Log in to manage orders, messages, your store, and your account.
      </p>

      <Alert variant="info" title="Authentication preview" className="mt-6">
        The account backend is implemented in Milestone 3. Form validation is active, but no login
        is performed yet.
      </Alert>

      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
