import type { Metadata } from "next";
import { Alert } from "@/components/ui/alert";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a Campus Market account.",
};

export default function RegisterPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        Create your account
      </h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        One account lets you buy from campus vendors and apply to open your own store.
      </p>

      <Alert variant="info" title="Registration preview" className="mt-6">
        The account database and email verification are implemented in Milestone 3. Form validation
        is active, but no account is created yet.
      </Alert>

      <div className="mt-6">
        <RegisterForm />
      </div>
    </div>
  );
}
