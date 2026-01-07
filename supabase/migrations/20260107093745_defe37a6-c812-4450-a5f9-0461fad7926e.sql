-- Add bio column for fan profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;