"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  storeName: z.string().trim().min(3, "Store name must be at least 3 characters").max(120),
  description: z.string().trim().min(10, "Describe your store in at least 10 characters").max(2000),
  businessCategory: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(32).optional(),
  whatsapp: z.string().trim().max(32).optional(),
  pickupAvailable: z.boolean(),
  deliveryAvailable: z.boolean(),
});

type Values = z.infer<typeof schema>;

export function VendorApplicationForm({
  defaultStoreName,
  defaultPhone,
}: {
  defaultStoreName?: string;
  defaultPhone?: string;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      storeName: defaultStoreName ?? "",
      description: "",
      businessCategory: "",
      phone: defaultPhone ?? "",
      whatsapp: "",
      pickupAvailable: true,
      deliveryAvailable: false,
    },
  });

  async function onSubmit(values: Values) {
    try {
      const res = await fetch("/api/v1/vendors/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const json = (await res.json()) as {
        error?: { message?: string; fields?: Record<string, string> };
      };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not submit your application", {
          description: json.error?.fields?.storeName,
        });
        return;
      }
      toast.success("Application submitted", {
        description: "An administrator will review your store.",
      });
      router.push("/sell/pending");
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
        label="Store name"
        htmlFor="store-name"
        required
        error={errors.storeName?.message}
        hint="This is what buyers will see."
      >
        <Input
          id="store-name"
          placeholder="e.g. KTU Gadget Hub"
          aria-invalid={Boolean(errors.storeName)}
          {...register("storeName")}
        />
      </FormField>

      <FormField
        label="What do you sell?"
        htmlFor="store-description"
        required
        error={errors.description?.message}
      >
        <Textarea
          id="store-description"
          placeholder="Describe your products, how you source them, and how buyers can reach you."
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Business category"
          htmlFor="store-category"
          error={errors.businessCategory?.message}
        >
          <Input
            id="store-category"
            placeholder="e.g. Electronics"
            {...register("businessCategory")}
          />
        </FormField>
        <FormField label="Phone" htmlFor="store-phone" error={errors.phone?.message}>
          <Input
            id="store-phone"
            placeholder="024 000 0000"
            inputMode="tel"
            {...register("phone")}
          />
        </FormField>
      </div>

      <FormField label="WhatsApp" htmlFor="store-whatsapp" error={errors.whatsapp?.message}>
        <Input
          id="store-whatsapp"
          placeholder="024 000 0000"
          inputMode="tel"
          {...register("whatsapp")}
        />
      </FormField>

      <fieldset className="space-y-3 rounded-lg border border-neutral-200 p-4">
        <legend className="px-1 text-sm font-medium text-neutral-900">Fulfilment</legend>
        <label className="flex items-start gap-3 text-sm text-neutral-700">
          <input
            type="checkbox"
            className="accent-brand-700 mt-0.5 h-4 w-4"
            {...register("pickupAvailable")}
          />
          <span>Buyers can pick up orders on campus.</span>
        </label>
        <label className="flex items-start gap-3 text-sm text-neutral-700">
          <input
            type="checkbox"
            className="accent-brand-700 mt-0.5 h-4 w-4"
            {...register("deliveryAvailable")}
          />
          <span>I can deliver within campus.</span>
        </label>
      </fieldset>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Submitting…" : "Submit application"}
      </Button>
    </form>
  );
}
