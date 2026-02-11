INSERT INTO feature_flags (flag_key, flag_name, is_enabled, description)
VALUES ('REFERRALS_ENABLED', 'Referrals', false, 'Artist referral/invite system - Coming soon')
ON CONFLICT (flag_key) DO NOTHING;