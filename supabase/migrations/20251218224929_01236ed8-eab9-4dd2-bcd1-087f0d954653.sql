-- Add assigned_key column for team assignments
ALTER TABLE inbox_messages ADD COLUMN IF NOT EXISTS assigned_key TEXT;

-- Add index for type filtering (needed for QA tab performance)
CREATE INDEX IF NOT EXISTS idx_inbox_messages_type ON inbox_messages(type);

-- Add index for assigned_key filtering
CREATE INDEX IF NOT EXISTS idx_inbox_messages_assigned_key ON inbox_messages(assigned_key);

-- Comment for documentation
COMMENT ON COLUMN inbox_messages.assigned_key IS 
  'Team/person key for assignment. Format: team:johan, team:esuni, team:lajo, team:qa_team. Mutually exclusive with assigned_to.';