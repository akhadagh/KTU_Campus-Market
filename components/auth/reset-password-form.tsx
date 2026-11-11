"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type Values = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: Values) {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      toast.error("Reset link is missing", {
        description: "Open the link from your reset email, or request a new one.",
      });
      return;
    }
    try {
      const res = await fetch("/api/v1/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: values.password }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not reset your password");
        return;
      }
      toast.success("Password updated", {
        description: "Log in with your new password.",
      });
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Could not reach the server", {
        description: "Check your connection and try again.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <FormField
        label="New password"
        htmlFor="reset-password"
        required
        error={errors.password?.message}
        hint="At least 8 characters."
      >
        <Input
          id="reset-password"
          type="password"
          autoComplete="new-password"
          placeholder="Enter a new password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "reset-password-error" : undefined}
          {...register("password")}
        />
      </FormField>

      <FormField
        label="Confirm new password"
        htmlFor="reset-confirm"
        required
        error={errors.confirmPassword?.message}
      >
        <Input
          id="reset-confirm"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat the new password"
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={errors.confirmPassword ? "reset-confirm-error" : undefined}
          {...register("confirmPassword")}
        />
      </FormField>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Updating…" : "Update password"}
      </Button>

      <p className="text-center text-sm text-neutral-600">
        Back to{" "}
        <Link href="/login" className="text-brand-700 hover:text-brand-900 font-medium">
          log in
        </Link>
      </p>
    </form>
  );
}
