-- Drop the existing constraint
ALTER TABLE beta_access_codes DROP CONSTRAINT IF EXISTS beta_codes_type_check;

-- Add the updated constraint with 'brand' included
ALTER TABLE beta_access_codes 
ADD CONSTRAINT beta_codes_type_check 
CHECK (type = ANY (ARRAY['artist'::text, 'fan'::text, 'brand'::text]));