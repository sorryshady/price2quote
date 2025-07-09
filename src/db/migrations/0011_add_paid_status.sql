-- Add 'paid' status to quote_status enum
-- This supports payment completion tracking for revenue analytics

-- Create new enum with paid status
CREATE TYPE quote_status_new AS ENUM (
  'draft',
  'awaiting_client', 
  'under_revision',
  'revised',
  'accepted',
  'rejected',
  'expired',
  'paid'
);

-- Update the quotes table to use the new enum
ALTER TABLE quotes 
  ALTER COLUMN status TYPE quote_status_new 
  USING status::text::quote_status_new;

-- Drop the old enum
DROP TYPE quote_status;

-- Rename the new enum to the original name
ALTER TYPE quote_status_new RENAME TO quote_status; 