CREATE TYPE "subscription_tier" AS ENUM('free', 'pro');
ALTER TABLE "users" ADD COLUMN "subscription_tier" "subscription_tier" DEFAULT 'free' NOT NULL;