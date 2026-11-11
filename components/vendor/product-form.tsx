"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DELIVERY_OPTIONS, PRODUCT_CONDITIONS } from "@/lib/validation";
import { deliveryLabels } from "@/lib/labels";

const schema = z.object({
  name: z.string().trim().min(3, "Product name is too short").max(180),
  categoryId: z.string().min(1, "Choose a category"),
  description: z
    .string()
    .trim()
    .min(20, "Describe the product in at least 20 characters")
    .max(5000),
  priceCedis: z.coerce.number().positive("Price must be greater than zero").max(1000000),
  originalPriceText: z.string().optional(),
  condition: z.enum(PRODUCT_CONDITIONS),
  quantity: z.coerce.number().int().min(0).max(100000),
  deliveryOptions: z.array(z.enum(DELIVERY_OPTIONS)).min(1, "Choose at least one delivery option"),
  pickupAvailable: z.boolean(),
  tagsText: z.string().max(300).optional(),
  imageUrlsText: z.string().max(4000).optional(),
  status: z.enum(["DRAFT", "PENDING_REVIEW"]),
});

type Values = z.output<typeof schema>;
type FormInput = z.input<typeof schema>;

export interface ProductFormData {
  id: string;
  name: string;
  categoryId: string;
  description: string;
  pricePesewas: number;
  originalPricePesewas: number | null;
  condition: string;
  quantity: number;
  deliveryOptions: string[];
  pickupAvailable: boolean;
  tags: string[];
  imageUrls: string[];
  status: string;
}

export function ProductForm({
  categories,
  product,
}: {
  categories: { id: string; name: string }[];
  product?: ProductFormData;
}) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: product?.name ?? "",
      categoryId: product?.categoryId ?? categories[0]?.id ?? "",
      description: product?.description ?? "",
      priceCedis: product ? product.pricePesewas / 100 : 0,
      originalPriceText:
        product?.originalPricePesewas != null ? String(product.originalPricePesewas / 100) : "",
      condition: (product?.condition as FormInput["condition"]) ?? "NOT_SPECIFIED",
      quantity: product?.quantity ?? 1,
      deliveryOptions: (product?.deliveryOptions as FormInput["deliveryOptions"]) ?? ["PICKUP"],
      pickupAvailable: product?.pickupAvailable ?? true,
      tagsText: product?.tags.join(", ") ?? "",
      imageUrlsText: product?.imageUrls.join("\n") ?? "",
      status: product?.status === "DRAFT" ? "DRAFT" : "PENDING_REVIEW",
    },
  });

  const selectedDelivery = useWatch({ control, name: "deliveryOptions" });

  function toggleDelivery(option: (typeof DELIVERY_OPTIONS)[number]) {
    const selected = selectedDelivery as (typeof DELIVERY_OPTIONS)[number][];
    const next = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    setValue("deliveryOptions", next, { shouldValidate: true });
  }

  async function onSubmit(values: Values) {
    const originalPrice = Number(values.originalPriceText);
    const payload = {
      name: values.name,
      categoryId: values.categoryId,
      description: values.description,
      priceCedis: values.priceCedis,
      originalPriceCedis:
        values.originalPriceText && Number.isFinite(originalPrice) && originalPrice > 0
          ? originalPrice
          : undefined,
      condition: values.condition,
      quantity: values.quantity,
      deliveryOptions: values.deliveryOptions,
      pickupAvailable: values.pickupAvailable,
      tags: (values.tagsText ?? "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      imageUrls: (values.imageUrlsText ?? "")
        .split("\n")
        .map((url) => url.trim())
        .filter(Boolean),
      status: values.status,
    };

    try {
      const res = await fetch(
        product ? `/api/v1/vendor/products/${product.id}` : "/api/v1/vendor/products",
        {
          method: product ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const json = (await res.json()) as {
        error?: { message?: string; fields?: Record<string, string> };
      };
      if (!res.ok) {
        toast.error(json.error?.message ?? "Could not save the product", {
          description: Object.values(json.error?.fields ?? {})[0],
        });
        return;
      }
      toast.success(product ? "Product updated" : "Product saved", {
        description:
          values.status === "PENDING_REVIEW"
            ? "It will appear in the marketplace once an administrator approves it."
            : "Saved as a draft. Submit it for review when it is ready.",
      });
      router.push("/sell/products");
      router.refresh();
    } catch {
      toast.error("Could not reach the server", {
        description: "Check your connection and try again.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Product name"
          htmlFor="product-name"
          required
          error={errors.name?.message}
        >
          <Input
            id="product-name"
            placeholder="e.g. HP EliteBook 840 G5"
            aria-invalid={Boolean(errors.name)}
            {...register("name")}
          />
        </FormField>
        <FormField
          label="Category"
          htmlFor="product-category"
          required
          error={errors.categoryId?.message}
        >
          <Select
            id="product-category"
            aria-invalid={Boolean(errors.categoryId)}
            {...register("categoryId")}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </FormField>
      </div>

      <FormField
        label="Description"
        htmlFor="product-description"
        required
        error={errors.description?.message}
        hint="Include condition details, what is included, and any defects."
      >
        <Textarea
          id="product-description"
          className="min-h-40"
          aria-invalid={Boolean(errors.description)}
          {...register("description")}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          label="Price (GH₵)"
          htmlFor="product-price"
          required
          error={errors.priceCedis?.message}
        >
          <Input
            id="product-price"
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            aria-invalid={Boolean(errors.priceCedis)}
            {...register("priceCedis")}
          />
        </FormField>
        <FormField
          label="Original price (optional)"
          htmlFor="product-original-price"
          error={errors.originalPriceText?.message}
          hint="Shown struck through."
        >
          <Input
            id="product-original-price"
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            {...register("originalPriceText")}
          />
        </FormField>
        <FormField
          label="Stock quantity"
          htmlFor="product-quantity"
          required
          error={errors.quantity?.message}
        >
          <Input
            id="product-quantity"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            aria-invalid={Boolean(errors.quantity)}
            {...register("quantity")}
          />
        </FormField>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Condition" htmlFor="product-condition" error={errors.condition?.message}>
          <Select id="product-condition" {...register("condition")}>
            {PRODUCT_CONDITIONS.map((condition) => (
              <option key={condition} value={condition}>
                {condition.replaceAll("_", " ").toLowerCase()}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Publish as" htmlFor="product-status" error={errors.status?.message}>
          <Select id="product-status" {...register("status")}>
            <option value="PENDING_REVIEW">Submit for review</option>
            <option value="DRAFT">Save as draft</option>
          </Select>
        </FormField>
      </div>

      <fieldset className="rounded-lg border border-neutral-200 p-4">
        <legend className="px-1 text-sm font-medium text-neutral-900">Delivery options</legend>
        <div className="mt-2 flex flex-wrap gap-4">
          {DELIVERY_OPTIONS.map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-neutral-700">
              <input
                type="checkbox"
                className="accent-brand-700 h-4 w-4"
                checked={selectedDelivery.includes(option)}
                onChange={() => toggleDelivery(option)}
              />
              {deliveryLabels[option]}
            </label>
          ))}
        </div>
        {errors.deliveryOptions ? (
          <p className="mt-2 text-sm text-red-600">{errors.deliveryOptions.message}</p>
        ) : null}
        <label className="mt-3 flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            className="accent-brand-700 h-4 w-4"
            {...register("pickupAvailable")}
          />
          Pickup available
        </label>
      </fieldset>

      <FormField
        label="Tags (optional)"
        htmlFor="product-tags"
        hint="Comma separated, e.g. laptop, dell, student"
      >
        <Input id="product-tags" placeholder="laptop, hp, student" {...register("tagsText")} />
      </FormField>

      <FormField
        label="Image URLs (optional)"
        htmlFor="product-images"
        hint="One URL per line. Image uploads require configured object storage; direct URLs work today."
      >
        <Textarea
          id="product-images"
          className="min-h-24"
          placeholder="https://example.com/photo-1.jpg"
          {...register("imageUrlsText")}
        />
      </FormField>

      <div className="flex gap-3">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : product ? "Save changes" : "Save product"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => router.push("/sell/products")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
