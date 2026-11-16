-- Customer dashboard foundations: saved addresses, account closure requests.
-- Structured vendor verification: seller type, business details, evidence and decisions.

CREATE TYPE "SellerType" AS ENUM ('INDIVIDUAL', 'BUSINESS', 'REPRESENTATIVE');

ALTER TABLE "vendor_profiles"
  ADD COLUMN "bannerUrl" TEXT,
  ADD COLUMN "sellerType" "SellerType" NOT NULL DEFAULT 'INDIVIDUAL',
  ADD COLUMN "businessAddress" TEXT,
  ADD COLUMN "registrationNumber" VARCHAR(80),
  ADD COLUMN "documentUrl" TEXT,
  ADD COLUMN "documentType" VARCHAR(60),
  ADD COLUMN "riskFlagsJson" JSONB,
  ADD COLUMN "verificationNote" TEXT,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "verifiedById" UUID;

ALTER TABLE "vendor_profiles"
  ADD CONSTRAINT "vendor_profiles_verifiedById_fkey"
  FOREIGN KEY ("verifiedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "users" ADD COLUMN "closureRequestedAt" TIMESTAMP(3);

CREATE TABLE "addresses" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "label" VARCHAR(60) NOT NULL,
  "recipientName" VARCHAR(160) NOT NULL,
  "phone" VARCHAR(32) NOT NULL,
  "address" VARCHAR(300) NOT NULL,
  "campus" VARCHAR(120),
  "instructions" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "addresses_userId_idx" ON "addresses"("userId");

ALTER TABLE "addresses"
  ADD CONSTRAINT "addresses_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
