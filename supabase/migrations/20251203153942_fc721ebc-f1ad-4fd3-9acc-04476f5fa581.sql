-- Drop the insecure public SELECT policy that allows beta code enumeration
DROP POLICY IF EXISTS "Anyone can view active beta codes" ON beta_access_codes;