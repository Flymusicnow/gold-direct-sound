-- Add expires_at column to promo_links for optional link expiration
ALTER TABLE promo_links 
ADD COLUMN expires_at timestamp with time zone DEFAULT NULL;