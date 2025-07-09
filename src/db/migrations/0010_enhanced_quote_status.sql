-- Enhanced Quote Status Migration
-- This migration updates the quote_status enum to support better quote lifecycle management

-- First, update any existing 'sent' status to 'awaiting_client'
UPDATE quotes SET status = 'awaiting_client' WHERE status = 'sent';

-- Create new enum type with enhanced statuses
CREATE TYPE quote_status_new AS ENUM (
  'draft',
  'awaiting_client',
  'under_revision', 
  'revised',
  'accepted',
  'rejected',
  'expired'
);

-- Update the quotes table to use the new enum
ALTER TABLE quotes ALTER COLUMN status TYPE quote_status_new USING status::text::quote_status_new;

-- Drop the old enum type
DROP TYPE quote_status;

-- Rename the new enum type to the original name
ALTER TYPE quote_status_new RENAME TO quote_status; 