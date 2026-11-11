import { describe, expect, it } from "vitest";
import { slugify, withSuffix } from "@/lib/slug";

describe("slug helpers", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("KTU Test Gadgets")).toBe("ktu-test-gadgets");
    expect(slugify("Phones & Chargers")).toBe("phones-chargers");
  });

  it("strips accents and punctuation", () => {
    expect(slugify("Café Décor")).toBe("cafe-decor");
    expect(slugify("  ---  ")).toBe("");
  });

  it("appends a suffix", () => {
    expect(withSuffix("HP EliteBook 840 G5", 2)).toBe("hp-elitebook-840-g5-2");
    expect(withSuffix("!!!", 7)).toBe("item-7");
  });
});
