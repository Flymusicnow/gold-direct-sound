-- Enable feature flags for Trust Layer and Live OS V2
UPDATE feature_flags SET is_enabled = true WHERE flag_key = 'TRUST_LAYER_ENABLED';
UPDATE feature_flags SET is_enabled = true WHERE flag_key = 'LIVE_OS_V2_ENABLED';

-- Add unique constraint for monthly wraps if not exists
ALTER TABLE fan_monthly_wraps 
ADD CONSTRAINT fan_monthly_wraps_user_month_year_unique 
UNIQUE (user_id, month, year);
