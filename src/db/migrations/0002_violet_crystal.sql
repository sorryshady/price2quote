ALTER TABLE "account" ADD COLUMN "access_token" varchar(2048);--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "refresh_token" varchar(2048);--> statement-breakpoint
ALTER TABLE "account" ADD COLUMN "expires_at" timestamp;