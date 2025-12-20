-- Add verification columns to inbox_messages
ALTER TABLE inbox_messages 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS verified_route TEXT,
ADD COLUMN IF NOT EXISTS verified_device TEXT;

-- Drop old status check constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'inbox_messages_status_check' 
    AND conrelid = 'inbox_messages'::regclass
  ) THEN
    ALTER TABLE inbox_messages DROP CONSTRAINT inbox_messages_status_check;
  END IF;
END $$;

-- Add updated constraint with 'verified' status
ALTER TABLE inbox_messages 
ADD CONSTRAINT inbox_messages_status_check 
CHECK (status IN ('unread', 'in_progress', 'resolved', 'verified'));