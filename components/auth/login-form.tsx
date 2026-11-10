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
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type Values = z.infer<typeof schema>;

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit() {
    await new Promise((resolve) => setTimeout(resolve, 350));
    toast.info("Authentication is not connected yet", {
      description:
        "The account backend is implemented in Milestone 3. No login was performed and no credentials were stored.",
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField label="Email address" htmlFor="login-email" required error={errors.email?.message}>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "login-email-error" : undefined}
          {...register("email")}
        />
      </FormField>

      <FormField
        label="Password"
        htmlFor="login-password"
        required
        error={errors.password?.message}
      >
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "login-password-error" : undefined}
          {...register("password")}
        />
      </FormField>

      <div className="flex items-center justify-between">
        <Link
          href="/forgot-password"
          className="text-brand-700 hover:text-brand-900 text-sm font-medium"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Checking…" : "Log in"}
      </Button>

      <p className="text-center text-sm text-neutral-600">
        New to Campus Market?{" "}
        <Link href="/register" className="text-brand-700 hover:text-brand-900 font-medium">
          Create an account
        </Link>
      </p>
    </form>
  );
}
