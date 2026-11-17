import { prisma } from "@/lib/db";

export const DEFAULT_PROHIBITED_ITEMS = [
  "weapons",
  "firearms",
  "ammunition",
  "explosives",
  "illegal drugs",
  "narcotics",
  "counterfeit money",
  "stolen goods",
  "human organs",
  "wildlife products",
  "ivory",
  "endangered species",
  "pornography",
  "prescription medicine without a licence",
  "tobacco without a licence",
  "alcohol without a licence",
  "hazardous chemicals",
  "asbestos",
  "laser pointers above 5mW",
];

export async function getProhibitedItems(): Promise<string[]> {
  const setting = await prisma.platformSetting.findUnique({
    where: { key: "marketplace.prohibitedItems" },
    select: { valueJson: true },
  });
  if (!setting || !Array.isArray(setting.valueJson)) return DEFAULT_PROHIBITED_ITEMS;
  const items = setting.valueJson.filter((item): item is string => typeof item === "string");
  return items.length > 0 ? items : DEFAULT_PROHIBITED_ITEMS;
}

/** Returns the matching prohibited term, or null when the listing is allowed. */
export async function findProhibitedTerm(text: string): Promise<string | null> {
  const items = await getProhibitedItems();
  const lower = text.toLowerCase();
  return items.find((item) => lower.includes(item.toLowerCase())) ?? null;
}
