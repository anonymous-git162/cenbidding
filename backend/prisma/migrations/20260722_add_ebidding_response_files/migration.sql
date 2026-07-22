-- Add file_ids column to ebidding_responses for bid attachments
ALTER TABLE "ebidding_responses" ADD COLUMN "file_ids" TEXT[] DEFAULT '{}' NOT NULL;
