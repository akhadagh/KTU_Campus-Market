"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, X } from "lucide-react";
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
  purchaseMode: z.enum(["INTERNAL", "EXTERNAL"]),
  externalUrl: z.string().optional(),
  network: z.string().optional(),
  dataAmount: z.string().optional(),
  validity: z.string().optional(),
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
  purchaseMode?: string;
  externalUrl?: string | null;
  digitalDetails?: { network?: string; dataAmount?: string; validity?: string } | null;
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
      purchaseMode: (product?.purchaseMode as "INTERNAL" | "EXTERNAL") ?? "INTERNAL",
      externalUrl: product?.externalUrl ?? "",
      network: product?.digitalDetails?.network ?? "",
      dataAmount: product?.digitalDetails?.dataAmount ?? "",
      validity: product?.digitalDetails?.validity ?? "",
      tagsText: product?.tags.join(", ") ?? "",
      imageUrlsText: product?.imageUrls.join("\n") ?? "",
      status: product?.status === "DRAFT" ? "DRAFT" : "PENDING_REVIEW",
    },
  });

  const [imagePreviews, setImagePreviews] = useState<string[]>(product?.imageUrls ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const selectedDelivery = useWatch({ control, name: "deliveryOptions" });
  const purchaseMode = useWatch({ control, name: "purchaseMode" });
  const isDigital = selectedDelivery.includes("DIGITAL");

  async function uploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/v1/vendor/products/images", { method: "POST", body });
      const json = (await res.json()) as {
        data?: { url?: string };
        error?: { message?: string };
      };
      if (!res.ok || !json.data?.url) {
        setUploadError(json.error?.message ?? "The image could not be uploaded.");
        return;
      }
      setImagePreviews((current) => [...current, json.data!.url!].slice(0, 4));
      setValue("imageUrlsText", [...imagePreviews, json.data.url].slice(0, 4).join("\n"), {
        shouldValidate: true,
      });
    } catch {
      setUploadError("Could not reach the server.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  function removeImage(index: number) {
    const next = imagePreviews.filter((_, position) => position !== index);
    setImagePreviews(next);
    setValue("imageUrlsText", next.join("\n"), { shouldValidate: true });
  }

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
      purchaseMode: values.purchaseMode,
      externalUrl: values.purchaseMode === "EXTERNAL" ? (values.externalUrl ?? "") : "",
      network: values.network ?? "",
      dataAmount: values.dataAmount ?? "",
      validity: values.validity ?? "",
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
        <legend className="px-1 text-sm font-medium text-neutral-900">How buyers get it</legend>
        <div className="mt-2 space-y-2">
          <label className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              value="INTERNAL"
              checked={purchaseMode === "INTERNAL"}
              onChange={() => setValue("purchaseMode", "INTERNAL")}
              className="accent-brand-700 mt-0.5 h-4 w-4"
            />
            <span>
              <span className="font-medium text-neutral-900">Sell on Campus Market</span>
              <span className="block text-xs text-neutral-600">
                Buyers pay here and you fulfil the order from your dashboard.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              value="EXTERNAL"
              checked={purchaseMode === "EXTERNAL"}
              onChange={() => setValue("purchaseMode", "EXTERNAL")}
              className="accent-brand-700 mt-0.5 h-4 w-4"
            />
            <span>
              <span className="font-medium text-neutral-900">Send buyers to my own link</span>
              <span className="block text-xs text-neutral-600">
                Useful for airtime and bundles sold on your own site, app or a provider page.
              </span>
            </span>
          </label>
        </div>
        {purchaseMode === "EXTERNAL" ? (
          <div className="mt-4">
            <FormField
              label="Purchase link"
              htmlFor="product-external-url"
              required
              error={errors.externalUrl?.message}
              hint="Buyers are redirected to this link to complete the purchase."
            >
              <Input
                id="product-external-url"
                type="url"
                placeholder="https://your-site.com/airtime"
                aria-invalid={Boolean(errors.externalUrl)}
                {...register("externalUrl")}
              />
            </FormField>
          </div>
        ) : null}
      </fieldset>

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
        {isDigital ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <FormField label="Network" htmlFor="product-network" error={errors.network?.message}>
              <Select id="product-network" {...register("network")}>
                <option value="">Choose</option>
                {["MTN", "Telecel", "Vodafone", "AirtelTigo", "Glo"].map((network) => (
                  <option key={network} value={network}>
                    {network}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField
              label="Data / bundle"
              htmlFor="product-data"
              error={errors.dataAmount?.message}
            >
              <Input id="product-data" placeholder="5GB" {...register("dataAmount")} />
            </FormField>
            <FormField label="Validity" htmlFor="product-validity" error={errors.validity?.message}>
              <Input id="product-validity" placeholder="30 days" {...register("validity")} />
            </FormField>
          </div>
        ) : null}
      </fieldset>

      <FormField
        label="Tags (optional)"
        htmlFor="product-tags"
        hint="Comma separated, e.g. laptop, dell, student"
      >
        <Input id="product-tags" placeholder="laptop, hp, student" {...register("tagsText")} />
      </FormField>

      <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
        <p className="text-sm font-medium text-neutral-900">Product photos</p>
        <p className="mt-1 text-xs leading-5 text-neutral-600">
          Upload up to four photos, or paste image links from anywhere. Listings with a clear photo
          sell much faster.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          {imagePreviews.map((preview, index) => (
            <div key={`${preview}-${index}`} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="h-20 w-20 rounded-lg border border-neutral-200 object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                aria-label={`Remove photo ${index + 1}`}
                className="absolute -top-2 -right-2 grid h-6 w-6 place-items-center rounded-full bg-neutral-900 text-white shadow-sm transition-colors hover:bg-red-600"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
          {imagePreviews.length < 4 ? (
            <label className="hover:border-brand-400 hover:text-brand-700 grid h-20 w-20 cursor-pointer place-items-center rounded-lg border border-dashed border-neutral-300 bg-white text-xs font-medium text-neutral-500 transition-colors">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                  <span className="sr-only">Upload photo</span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={(event) => void uploadImage(event)}
                disabled={uploading}
              />
            </label>
          ) : null}
        </div>
        {uploadError ? (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {uploadError}
          </p>
        ) : null}
        <input type="hidden" {...register("imageUrlsText")} />
      </div>

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
