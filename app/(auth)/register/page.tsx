import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a JUMART account.",
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

      <div className="mt-6">
        <RegisterForm />
      </div>
    </div>
  );
}
