import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to your JUMART account.",
};

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Welcome back</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        Log in to manage orders, messages, your store, and your account.
      </p>

      <div className="mt-6">
        <LoginForm />
      </div>
    </div>
  );
}
