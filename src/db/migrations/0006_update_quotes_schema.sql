-- Update quotes table structure
ALTER TABLE "quotes" RENAME COLUMN "title" TO "project_title";
ALTER TABLE "quotes" RENAME COLUMN "description" TO "project_description";

-- Add revised status to quote_status enum
ALTER TYPE "quote_status" ADD VALUE 'revised';

-- Create quote_services table
CREATE TABLE "quote_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"quantity" numeric(5, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(10, 2),
	"total_price" numeric(10, 2),
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key constraints
ALTER TABLE "quote_services" ADD CONSTRAINT "quote_services_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "quote_services" ADD CONSTRAINT "quote_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action; 