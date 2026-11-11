import { describe, expect, it } from "vitest";
import {
  checkoutSchema,
  productSchema,
  reviewSchema,
  vendorApplicationSchema,
} from "@/lib/validation";

describe("validation schemas", () => {
  it("rejects a store application without a description", () => {
    const parsed = vendorApplicationSchema.safeParse({
      storeName: "KTU Gadgets",
      description: "short",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts a complete store application", () => {
    const parsed = vendorApplicationSchema.safeParse({
      storeName: "KTU Gadgets",
      description: "We sell chargers and cables around campus every day.",
      pickupAvailable: true,
      deliveryAvailable: false,
    });
    expect(parsed.success).toBe(true);
  });

  it("requires a positive price and a category for products", () => {
    const parsed = productSchema.safeParse({
      name: "Charger",
      categoryId: "not-a-uuid",
      description: "A charger that charges very fast for all your devices.",
      priceCedis: 0,
      quantity: 1,
      deliveryOptions: [],
    });
    expect(parsed.success).toBe(false);
  });

  it("requires an idempotency key on checkout", () => {
    const parsed = checkoutSchema.safeParse({ deliveryMethod: "PICKUP" });
    expect(parsed.success).toBe(false);
  });

  it("keeps ratings between one and five", () => {
    const orderItemId = "3f6b2f3a-8f1c-4a54-9f4d-2f0c7b2f9a11";
    expect(reviewSchema.safeParse({ orderItemId, rating: 6 }).success).toBe(false);
    expect(reviewSchema.safeParse({ orderItemId, rating: 4 }).success).toBe(true);
  });
});
