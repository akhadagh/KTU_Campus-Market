-- Second-factor challenges for staff accounts.

CREATE TABLE "mfa_challenges" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "codeHash" VARCHAR(128) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "mfa_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "mfa_challenges_userId_createdAt_idx" ON "mfa_challenges"("userId", "createdAt");

ALTER TABLE "mfa_challenges"
  ADD CONSTRAINT "mfa_challenges_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
