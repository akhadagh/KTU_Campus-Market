-- Sellers can respond to a published review; staff see the reply.
ALTER TABLE "reviews" ADD COLUMN "vendorReply" TEXT;
