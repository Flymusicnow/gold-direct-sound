-- Make artist_beta_access.code_id nullable to match fan_beta_access behavior
-- This allows direct signups without requiring an invite code

ALTER TABLE artist_beta_access 
ALTER COLUMN code_id DROP NOT NULL;

-- Add comment to explain the nullable code_id
COMMENT ON COLUMN artist_beta_access.code_id IS 'The beta access code used. NULL for direct signups.';

-- Backfill fan_beta_access for existing fans who lack explicit records
-- This ensures legacy users can access the fan portal
INSERT INTO fan_beta_access (user_id, badge_name, redeemed_at)
SELECT DISTINCT ur.user_id, 'Legacy Member', now()
FROM user_roles ur
WHERE ur.role = 'fan'
AND NOT EXISTS (
  SELECT 1 FROM fan_beta_access fba WHERE fba.user_id = ur.user_id
);

-- Backfill artist_beta_access for existing artists who lack explicit records
INSERT INTO artist_beta_access (user_id, badge_name, redeemed_at)
SELECT DISTINCT ur.user_id, 'Legacy Creator', now()
FROM user_roles ur
WHERE ur.role = 'artist'
AND NOT EXISTS (
  SELECT 1 FROM artist_beta_access aba WHERE aba.user_id = ur.user_id
);