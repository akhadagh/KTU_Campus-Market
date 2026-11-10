"use client";

import Link from "next/link";
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
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit() {
    await new Promise((resolve) => setTimeout(resolve, 350));
    toast.info("Password reset is not connected yet", {
      description:
        "Password reset tokens and session revocation are implemented in Milestone 3. No password was changed.",
    });
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
