
# Fix: Video Thumbnail Upload RLS Policy

## Problem Identified

When trying to save changes in the Edit Video dialog (with a new thumbnail), the upload fails with:
```
StorageApiError: new row violates row-level security policy
```

## Root Cause

The `artist_videos` storage bucket INSERT policy is:
```sql
with_check: ((bucket_id = 'artist_videos') AND (auth.uid() IS NOT NULL))
```

This policy is different from other working storage buckets. Comparing to `community-banners` which works correctly:
```sql
with_check: ((bucket_id = 'community-banners') AND ((storage.foldername(name))[1] IN 
  (SELECT (ap.id)::text FROM artist_profiles ap WHERE (ap.user_id = auth.uid()))))
```

The current policy:
1. Uses `auth.uid() IS NOT NULL` which may not properly validate the auth context
2. Doesn't validate that the user owns the folder they're uploading to

## Solution

Update the `artist_videos` storage INSERT policy to match the `community-banners` pattern, which:
1. Uses a subquery to validate folder ownership
2. Ensures the folder name matches an artist_profile.id belonging to the current user

## Database Migration Required

```sql
-- Drop the existing insufficient policy
DROP POLICY IF EXISTS "Artists can upload own videos" ON storage.objects;

-- Create new policy that validates folder ownership
CREATE POLICY "Artists can upload own videos" ON storage.objects
FOR INSERT 
TO public 
WITH CHECK (
  bucket_id = 'artist_videos' 
  AND (storage.foldername(name))[1] IN (
    SELECT (ap.id)::text 
    FROM artist_profiles ap 
    WHERE ap.user_id = auth.uid()
  )
);
```

This policy ensures:
- Uploads only go to the `artist_videos` bucket
- The folder path's first segment must be an artist_profile.id owned by the authenticated user

## Additional: Update DELETE Policy for Consistency

The DELETE policy currently uses `auth.uid()` for the folder check, but should also use artist_profile.id:

```sql
-- Update delete policy for consistency
DROP POLICY IF EXISTS "Artists can delete own videos" ON storage.objects;

CREATE POLICY "Artists can delete own videos" ON storage.objects
FOR DELETE 
TO public 
USING (
  bucket_id = 'artist_videos' 
  AND (storage.foldername(name))[1] IN (
    SELECT (ap.id)::text 
    FROM artist_profiles ap 
    WHERE ap.user_id = auth.uid()
  )
);
```

## Summary

| Change | Type | Purpose |
|--------|------|---------|
| Update INSERT policy | Database Migration | Allow uploads to artist_profile.id folders |
| Update DELETE policy | Database Migration | Allow deletes from artist_profile.id folders |

No code changes are needed - the `EditVideoDialog.tsx` and `StudioVideos.tsx` already use `artistProfile.id` for paths, which is correct. The storage RLS policies just need to be updated to recognize this pattern.
