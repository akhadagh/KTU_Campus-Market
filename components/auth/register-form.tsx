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
import { Select } from "@/components/ui/select";

const schema = z
  .object({
    fullName: z.string().min(2, "Enter your full name"),
    email: z.string().min(1, "Enter your email address").email("Enter a valid email address"),
    phone: z.string().min(10, "Enter a valid phone number"),
    campus: z.string().min(1, "Select your campus"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
    acceptTerms: z.boolean().refine((value) => value, {
      message: "You must accept the terms and marketplace policies",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type Values = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      campus: "ktu-main",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  async function onSubmit(values: Values) {
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: values.fullName,
          email: values.email,
          phone: values.phone,
          password: values.password,
        }),
      });
      const json = (await res.json()) as {
        data?: { user: { fullName: string }; emailVerification?: string };
        error?: { message?: string; fields?: Record<string, string> };
      };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not create your account", {
          description: json.error?.fields?.email ?? "Fix the highlighted fields and try again.",
        });
        return;
      }
      toast.success(`Account created. Welcome, ${json.data?.user.fullName ?? "student"}!`, {
        description:
          json.data?.emailVerification === "sent"
            ? "We sent a verification link to your email."
            : "Email delivery is not configured on this deployment, so no verification email was sent. You can request one from your account page.",
      });
      router.push("/account");
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
        label="Full name"
        htmlFor="register-name"
        required
        error={errors.fullName?.message}
      >
        <Input
          id="register-name"
          autoComplete="name"
          placeholder="Ama Mensah"
          aria-invalid={Boolean(errors.fullName)}
          aria-describedby={errors.fullName ? "register-name-error" : undefined}
          {...register("fullName")}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Email address"
          htmlFor="register-email"
          required
          error={errors.email?.message}
        >
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "register-email-error" : undefined}
            {...register("email")}
          />
        </FormField>

        <FormField
          label="Phone number"
          htmlFor="register-phone"
          required
          error={errors.phone?.message}
        >
          <Input
            id="register-phone"
            type="tel"
            autoComplete="tel"
            placeholder="+233 20 000 0000"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "register-phone-error" : undefined}
            {...register("phone")}
          />
        </FormField>
      </div>

      <FormField
        label="Campus"
        htmlFor="register-campus"
        required
        error={errors.campus?.message}
        hint="Additional campuses will be available as the platform expands."
      >
        <Select
          id="register-campus"
          aria-invalid={Boolean(errors.campus)}
          aria-describedby={errors.campus ? "register-campus-error" : undefined}
          {...register("campus")}
        >
          <option value="ktu-main">KTU Main Campus</option>
        </Select>
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Password"
          htmlFor="register-password"
          required
          error={errors.password?.message}
          hint="At least 8 characters."
        >
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "register-password-error" : undefined}
            {...register("password")}
          />
        </FormField>

        <FormField
          label="Confirm password"
          htmlFor="register-confirm"
          required
          error={errors.confirmPassword?.message}
        >
          <Input
            id="register-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "register-confirm-error" : undefined}
            {...register("confirmPassword")}
          />
        </FormField>
      </div>

      <div>
        <label className="flex items-start gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            className="text-brand-700 focus-visible:ring-brand-500 mt-1 h-4 w-4 rounded border-neutral-300 focus-visible:ring-2 focus-visible:outline-none"
            aria-invalid={Boolean(errors.acceptTerms)}
            aria-describedby={errors.acceptTerms ? "register-terms-error" : undefined}
            {...register("acceptTerms")}
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-brand-700 hover:text-brand-900 font-medium">
              terms
            </Link>
            ,{" "}
            <Link href="/privacy" className="text-brand-700 hover:text-brand-900 font-medium">
              privacy policy
            </Link>
            , and{" "}
            <Link href="/policies" className="text-brand-700 hover:text-brand-900 font-medium">
              marketplace policies
            </Link>
            .
          </span>
        </label>
        {errors.acceptTerms ? (
          <p
            id="register-terms-error"
            role="alert"
            className="mt-1 text-xs font-medium text-red-600"
          >
            {errors.acceptTerms.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-neutral-600">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-700 hover:text-brand-900 font-medium">
          Log in
        </Link>
      </p>
    </form>
  );
}
