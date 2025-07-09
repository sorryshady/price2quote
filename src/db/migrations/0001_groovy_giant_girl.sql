ALTER TABLE "quotes" ADD COLUMN "subtotal" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "tax_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "tax_rate" numeric(5, 4) DEFAULT '0';--> statement-breakpoint
ALTER TABLE "quotes" ADD COLUMN "tax_amount" numeric(10, 2) DEFAULT '0';