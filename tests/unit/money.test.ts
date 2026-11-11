import { describe, expect, it } from "vitest";
import { cedisToPesewas, formatPesewas, pesewasToCedis } from "@/lib/money";

describe("money helpers", () => {
  it("formats pesewas as Ghana cedis", () => {
    expect(formatPesewas(8500)).toBe("GH₵85.00");
    expect(formatPesewas(0)).toBe("GH₵0.00");
    expect(formatPesewas(125)).toBe("GH₵1.25");
  });

  it("converts between cedis and pesewas", () => {
    expect(cedisToPesewas(85)).toBe(8500);
    expect(cedisToPesewas(85.5)).toBe(8550);
    expect(pesewasToCedis(8500)).toBe(85);
  });
});
