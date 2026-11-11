import { describe, expect, it } from "vitest";
import { extractKeywords } from "@/lib/ai";
import { generateOrderNumber, VENDOR_ORDER_TRANSITIONS } from "@/lib/orders";

describe("assistant keyword extraction", () => {
  it("drops stop words and short tokens", () => {
    expect(extractKeywords("I need a laptop under 500 cedis")).toEqual([
      "laptop",
      "under",
      "500",
      "cedis",
    ]);
  });

  it("keeps useful terms and limits the count", () => {
    const keywords = extractKeywords(
      "charger cable laptop phone hostel essentials desk fan notes books",
    );
    expect(keywords).toHaveLength(8);
    expect(keywords).toContain("charger");
  });
});

describe("order helpers", () => {
  it("generates unique order numbers", () => {
    const first = generateOrderNumber();
    const second = generateOrderNumber();
    expect(first).toMatch(/^CM-\d{8}-\d{5}$/);
    expect(first).not.toBe(second);
  });

  it("only allows valid fulfilment transitions", () => {
    expect(VENDOR_ORDER_TRANSITIONS["PENDING"]).toContain("ACCEPTED");
    expect(VENDOR_ORDER_TRANSITIONS["ACCEPTED"]).not.toContain("DELIVERED");
    expect(VENDOR_ORDER_TRANSITIONS["DELIVERED"]).toEqual([]);
  });
});
