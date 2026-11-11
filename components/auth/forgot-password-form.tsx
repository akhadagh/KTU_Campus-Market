"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().min(1, "Enter your email address").email("Enter a valid email address"),
});

type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  async function onSubmit(values: Values) {
    try {
      const res = await fetch("/api/v1/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });
      const json = (await res.json()) as {
        data?: { delivery?: string };
        error?: { message?: string };
      };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not send the reset link");
        return;
      }
      toast.success("Check your email", {
        description:
          json.data?.delivery === "provider_not_configured"
            ? "If that email is registered, a reset link was created. Email delivery is not configured yet, so nothing was sent."
            : "If that email is registered, a reset link is on its way.",
      });
    } catch {
      toast.error("Could not reach the server", {
        description: "Check your connection and try again.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField
        label="Email address"
        htmlFor="forgot-email"
        required
        error={errors.email?.message}
        hint="If an account exists, a reset link will be sent. This page will not reveal whether an email is registered."
      >
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "forgot-email-error" : undefined}
          {...register("email")}
        />
      </FormField>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-neutral-600">
        Remember your password?{" "}
        <Link href="/login" className="text-brand-700 hover:text-brand-900 font-medium">
          Log in
        </Link>
      </p>
    </form>
  );
}
