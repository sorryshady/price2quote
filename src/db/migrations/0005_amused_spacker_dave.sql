CREATE TABLE "email_sync_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"last_sync_at" timestamp,
	"last_message_id" varchar(255),
	"sync_enabled" boolean DEFAULT true,
	"sync_frequency_minutes" integer DEFAULT 15,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_threads" ADD COLUMN "direction" varchar(10) DEFAULT 'outbound' NOT NULL;--> statement-breakpoint
ALTER TABLE "email_threads" ADD COLUMN "from_email" varchar(255);--> statement-breakpoint
ALTER TABLE "email_threads" ADD COLUMN "is_read" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "email_threads" ADD COLUMN "gmail_labels" text;--> statement-breakpoint
ALTER TABLE "email_threads" ADD COLUMN "email_type" varchar(50);--> statement-breakpoint
ALTER TABLE "email_sync_status" ADD CONSTRAINT "email_sync_status_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_sync_status" ADD CONSTRAINT "email_sync_status_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;