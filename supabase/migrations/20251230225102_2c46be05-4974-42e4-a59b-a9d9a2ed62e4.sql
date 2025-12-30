-- Add stripe_product_id column to supporter_tiers table
ALTER TABLE supporter_tiers 
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;

COMMENT ON COLUMN supporter_tiers.stripe_product_id IS 'Stripe Product ID for this tier';