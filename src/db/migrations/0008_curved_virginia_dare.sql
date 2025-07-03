-- Create enums
DO $$ BEGIN
  CREATE TYPE "delivery_timeline" AS ENUM ('1_week', '2_weeks', '1_month', '2_months', '3_months', 'custom');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "project_complexity" AS ENUM ('simple', 'moderate', 'complex');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add columns to quotes table
ALTER TABLE "quotes" ADD COLUMN "delivery_timeline" "delivery_timeline" DEFAULT '1_month' NOT NULL;
ALTER TABLE "quotes" ADD COLUMN "custom_timeline" text;
ALTER TABLE "quotes" ADD COLUMN "project_complexity" "project_complexity" DEFAULT 'moderate' NOT NULL; 