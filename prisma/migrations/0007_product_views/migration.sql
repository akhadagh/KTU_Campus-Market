-- Recently viewed and discovery signals for the marketplace.

CREATE TABLE "product_views" (
  "id" UUID NOT NULL,
  "userId" UUID,
  "productId" UUID NOT NULL,
  "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "product_views_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "product_views_userId_viewedAt_idx" ON "product_views"("userId", "viewedAt");
CREATE INDEX "product_views_productId_idx" ON "product_views"("productId");

ALTER TABLE "product_views"
  ADD CONSTRAINT "product_views_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_views"
  ADD CONSTRAINT "product_views_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
