import { prisma } from "@/lib/db";

export interface MarketplaceSettings {
  demoStoresVisible: boolean;
}

const DEFAULTS: MarketplaceSettings = {
  demoStoresVisible: true,
};

export async function getMarketplaceSettings(): Promise<MarketplaceSettings> {
  const rows = await prisma.platformSetting.findMany({
    where: { key: { in: ["marketplace.demoStoresVisible"] } },
    select: { key: true, valueJson: true },
  });
  const values = Object.fromEntries(rows.map((row) => [row.key, row.valueJson]));
  const stored = values["marketplace.demoStoresVisible"];
  return {
    demoStoresVisible: stored === undefined ? DEFAULTS.demoStoresVisible : stored === true,
  };
}

export async function setMarketplaceSetting(
  key: keyof MarketplaceSettings,
  value: boolean,
  actorId: string,
): Promise<void> {
  await prisma.platformSetting.upsert({
    where: { key: `marketplace.${key}` },
    create: { key: `marketplace.${key}`, valueJson: value, updatedById: actorId },
    update: { valueJson: value, updatedById: actorId },
  });
}

/** Vendors hidden from the public marketplace unless demo stores are enabled. */
export function vendorFilter(settings: MarketplaceSettings): { isDemo?: boolean } {
  return settings.demoStoresVisible ? {} : { isDemo: false };
}
