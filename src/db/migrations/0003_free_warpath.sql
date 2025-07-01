CREATE TYPE "ai_summary_status" AS ENUM('pending', 'generating', 'completed', 'failed');
ALTER TABLE "companies" ADD COLUMN "ai_summary_status" "ai_summary_status" DEFAULT 'pending';