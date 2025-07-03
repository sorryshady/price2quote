CREATE TABLE "quote_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"original_quote_id" uuid NOT NULL,
	"version_number" numeric(3, 0) NOT NULL,
	"revision_notes" text,
	"client_feedback" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "parent_quote_id" uuid;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "revision_notes" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "client_feedback" text;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "version_number" numeric(3, 0) DEFAULT '1' NOT NULL;--> statement-breakpoint
ALTER TABLE "quote_versions" ADD CONSTRAINT "quote_versions_original_quote_id_quotes_id_fk" FOREIGN KEY ("original_quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_parent_quote_id_quotes_id_fk" FOREIGN KEY ("parent_quote_id") REFERENCES "public"."quotes"("id") ON DELETE set null ON UPDATE no action;