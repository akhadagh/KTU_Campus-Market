-- JUMART modules: free learning materials, admin-approved external vendor links,
-- and support conversations with the JUMART team.

CREATE TYPE "ConversationKind" AS ENUM ('SELLER', 'SUPPORT');
CREATE TYPE "ExternalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "LearningMaterialStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

ALTER TABLE "conversations"
  ALTER COLUMN "vendorId" DROP NOT NULL,
  ADD COLUMN "kind" "ConversationKind" NOT NULL DEFAULT 'SELLER',
  ADD COLUMN "subject" VARCHAR(160);

ALTER TABLE "products"
  ADD COLUMN "externalStatus" "ExternalStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "externalReviewedById" UUID,
  ADD COLUMN "externalReviewedAt" TIMESTAMP(3),
  ADD COLUMN "externalNote" TEXT;

ALTER TABLE "products"
  ADD CONSTRAINT "products_externalReviewedById_fkey"
  FOREIGN KEY ("externalReviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "learning_materials" (
  "id" UUID NOT NULL,
  "title" VARCHAR(180) NOT NULL,
  "description" TEXT,
  "course" VARCHAR(120),
  "level" VARCHAR(80),
  "category" TEXT NOT NULL DEFAULT 'PAST_QUESTIONS',
  "fileUrl" TEXT NOT NULL,
  "fileName" VARCHAR(180) NOT NULL,
  "fileType" VARCHAR(40) NOT NULL,
  "sizeBytes" INTEGER NOT NULL DEFAULT 0,
  "isFree" BOOLEAN NOT NULL DEFAULT true,
  "status" "LearningMaterialStatus" NOT NULL DEFAULT 'DRAFT',
  "downloadCount" INTEGER NOT NULL DEFAULT 0,
  "uploadedById" UUID,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "learning_materials_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "learning_materials_status_category_idx" ON "learning_materials"("status", "category");
CREATE INDEX "learning_materials_course_idx" ON "learning_materials"("course");

ALTER TABLE "learning_materials"
  ADD CONSTRAINT "learning_materials_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "conversations_kind_lastMessageAt_idx" ON "conversations"("kind", "lastMessageAt");
