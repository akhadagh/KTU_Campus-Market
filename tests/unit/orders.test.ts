import { describe, expect, it } from "vitest";
import { generateOrderNumber, VENDOR_ORDER_TRANSITIONS } from "@/lib/orders";

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
