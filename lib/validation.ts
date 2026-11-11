import { z } from "zod";

export const DELIVERY_OPTIONS = ["PICKUP", "CAMPUS_DELIVERY", "COURIER", "DIGITAL"] as const;
export const PRODUCT_CONDITIONS = [
  "NEW",
  "LIKE_NEW",
  "USED_GOOD",
  "USED_FAIR",
  "REFURBISHED",
  "NOT_SPECIFIED",
] as const;

export const vendorApplicationSchema = z.object({
  storeName: z
    .string()
    .trim()
    .min(3, "Store name must be at least 3 characters")
    .max(120, "Store name is too long"),
  description: z
    .string()
    .trim()
    .min(10, "Describe your store in at least 10 characters")
    .max(2000, "Description is too long"),
  businessCategory: z.string().trim().max(80).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(9, "Enter a valid phone number")
    .max(32)
    .optional()
    .or(z.literal("")),
  whatsapp: z
    .string()
    .trim()
    .min(9, "Enter a valid WhatsApp number")
    .max(32)
    .optional()
    .or(z.literal("")),
  pickupAvailable: z.boolean().default(true),
  deliveryAvailable: z.boolean().default(false),
});

export const productSchema = z.object({
  name: z.string().trim().min(3, "Product name is too short").max(180, "Product name is too long"),
  categoryId: z.string().uuid("Choose a category"),
  description: z
    .string()
    .trim()
    .min(20, "Describe the product in at least 20 characters")
    .max(5000, "Description is too long"),
  priceCedis: z.coerce.number().positive("Price must be greater than zero").max(1000000),
  originalPriceCedis: z.coerce.number().positive().max(1000000).optional(),
  condition: z.enum(PRODUCT_CONDITIONS).default("NOT_SPECIFIED"),
  quantity: z.coerce.number().int().min(0).max(100000),
  deliveryOptions: z.array(z.enum(DELIVERY_OPTIONS)).min(1, "Choose at least one delivery option"),
  pickupAvailable: z.boolean().default(true),
  purchaseMode: z.enum(["INTERNAL", "EXTERNAL"]).default("INTERNAL"),
  externalUrl: z.string().trim().max(600).optional().or(z.literal("")),
  network: z.string().trim().max(40).optional().or(z.literal("")),
  dataAmount: z.string().trim().max(40).optional().or(z.literal("")),
  validity: z.string().trim().max(40).optional().or(z.literal("")),
  tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  imageUrls: z.array(z.string().url("Image URL must be valid").max(600)).max(8).default([]),
  status: z.enum(["DRAFT", "PENDING_REVIEW"]).default("PENDING_REVIEW"),
});

export const productUpdateSchema = productSchema.partial().extend({
  status: z.enum(["DRAFT", "PENDING_REVIEW", "ARCHIVED"]).optional(),
});

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter the recipient name").max(160),
  phone: z.string().trim().min(9, "Enter a valid phone number").max(32),
  campus: z.string().trim().max(120).optional(),
  address: z.string().trim().min(5, "Enter a delivery address").max(300),
  instructions: z.string().trim().max(500).optional(),
});

export const checkoutSchema = z.object({
  deliveryMethod: z.enum(DELIVERY_OPTIONS),
  pickupLocationId: z.string().uuid().optional(),
  deliveryAddress: addressSchema.optional(),
  notes: z.string().trim().max(1000).optional(),
  msisdn: z
    .string()
    .trim()
    .regex(/^(\+?233)?[0-9]{9,10}$/, "Enter a valid phone number, e.g. 0241234567")
    .optional()
    .or(z.literal("")),
  idempotencyKey: z.string().min(8).max(128),
});

export const reviewSchema = z.object({
  orderItemId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const reportSchema = z.object({
  targetType: z.enum(["PRODUCT", "VENDOR", "USER", "ORDER", "REVIEW"]),
  targetId: z.string().uuid(),
  reason: z.enum([
    "FAKE_LISTING",
    "COUNTERFEIT",
    "MISLEADING_DESCRIPTION",
    "INAPPROPRIATE_CONTENT",
    "HARASSMENT",
    "FRAUD",
    "OTHER",
  ]),
  description: z.string().trim().min(10, "Explain the issue").max(2000),
});

export const messageSchema = z.object({
  vendorId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  body: z.string().trim().min(1, "Write a message").max(2000),
});

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(160),
  phone: z
    .string()
    .trim()
    .min(9, "Enter a valid phone number")
    .max(32)
    .optional()
    .or(z.literal("")),
});

export const studentVerificationSchema = z.object({
  method: z.enum(["INSTITUTION_EMAIL", "DOCUMENT", "ADMIN_APPROVAL"]),
  institutionEmail: z
    .string()
    .trim()
    .email("Enter a valid email")
    .max(320)
    .optional()
    .or(z.literal("")),
  documentUrl: z.string().url("Provide a document link").max(600).optional().or(z.literal("")),
});

export function buildDigitalDetails(values: {
  network?: string | undefined;
  dataAmount?: string | undefined;
  validity?: string | undefined;
  deliveryOptions?: readonly string[] | undefined;
}): Record<string, string> | null {
  const isDigital = values.deliveryOptions?.includes("DIGITAL");
  if (!isDigital && !values.network && !values.dataAmount) return null;
  return {
    network: values.network || "",
    dataAmount: values.dataAmount || "",
    validity: values.validity || "",
  };
}
