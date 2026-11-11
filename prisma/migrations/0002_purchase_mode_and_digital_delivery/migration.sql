-- Digital fulfilment (airtime and data bundles) and vendor-hosted purchase links.

CREATE TYPE "PurchaseMode" AS ENUM ('INTERNAL', 'EXTERNAL');

ALTER TYPE "DeliveryOption" ADD VALUE 'DIGITAL';

ALTER TABLE "products"
  ADD COLUMN "purchaseMode" "PurchaseMode" NOT NULL DEFAULT 'INTERNAL',
  ADD COLUMN "externalUrl" TEXT,
  ADD COLUMN "digitalDetails" JSONB;
