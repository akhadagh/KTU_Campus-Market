-- Marks the seeded showcase stores so they can be switched off in one setting.
ALTER TABLE "vendor_profiles" ADD COLUMN "isDemo" BOOLEAN NOT NULL DEFAULT false;
