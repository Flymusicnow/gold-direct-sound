-- Add columns for tracking replaced invites
ALTER TABLE beta_invites 
ADD COLUMN IF NOT EXISTS replaced_by uuid,
ADD COLUMN IF NOT EXISTS replaced_at timestamptz;

-- Add foreign key constraint
ALTER TABLE beta_invites 
ADD CONSTRAINT fk_beta_invites_replaced_by 
FOREIGN KEY (replaced_by) REFERENCES beta_invites(id);

-- Index for faster lookups on active invites
CREATE INDEX IF NOT EXISTS idx_beta_invites_active 
ON beta_invites(email, role) 
WHERE replaced_by IS NULL AND status NOT IN ('redeemed', 'replaced');