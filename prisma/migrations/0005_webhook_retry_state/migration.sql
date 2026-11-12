-- Webhook retry state: attempts counter and last error so a received-but-not-processed
-- event can be retried safely and remains available for administrative review.

ALTER TABLE "webhook_events"
  ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "errorMessage" TEXT;
