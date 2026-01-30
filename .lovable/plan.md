
# Plan: Fix Comment Author Display Across All Comment Systems

## Problem Summary
User reports that:
- Artist names show as "Artist" (fallback) instead of their real name
- Fan comments show as "Anonymous" and aren't clickable
- Profile pictures don't display

The root cause: Three comment components query the `profiles` table directly, which is blocked by RLS for other users' data. Per the "identity-resolution-privacy-protocol", all queries for other users must use `public_profiles` view.

## Components Affected

```text
┌─────────────────────────────────────────────────────────────┐
│                    IDENTITY RESOLUTION                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ useAuthorIdentity.ts (ALREADY FIXED)                    │
│     └── Uses public_profiles                                │
│                                                             │
│  ✅ CommentThread.tsx (Community posts)                     │
│     └── Uses fetchAuthorIdentities (now fixed)              │
│                                                             │
│  ❌ CommentsSection.tsx (Artist profile comments)           │
│     └── Line 108-111: queries profiles directly             │
│                                                             │
│  ❌ CommentItem.tsx (Reply loading)                         │
│     └── Line 166-170: queries profiles directly             │
│                                                             │
│  ❌ VideoCommentsSection.tsx (Video comments)               │
│     └── Line 85-89: queries profiles directly               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Changes Required

### File 1: `src/components/CommentsSection.tsx`

**Change (lines 108-111):**
```tsx
// BEFORE:
const { data: profilesData } = await supabase
  .from("profiles")
  .select("id, full_name, avatar_url, email" as any)
  .in("id", userIds);

// AFTER:
const { data: profilesData } = await supabase
  .from("public_profiles")
  .select("id, full_name, avatar_url")
  .in("id", userIds);
```

### File 2: `src/components/CommentItem.tsx`

**Change (lines 166-170):**
```tsx
// BEFORE:
supabase
  .from("profiles")
  .select("id, full_name, avatar_url, email" as any)
  .in("id", userIds),

// AFTER:
supabase
  .from("public_profiles")
  .select("id, full_name, avatar_url")
  .in("id", userIds),
```

### File 3: `src/components/video/VideoCommentsSection.tsx`

**Change (lines 85-89):**
```tsx
// BEFORE:
supabase
  .from('profiles')
  .select('id, full_name, email')
  .in('id', userIds),

// AFTER:
supabase
  .from('public_profiles')
  .select('id, full_name, avatar_url')
  .in('id', userIds),
```

## Expected Results

After these changes:
- Artist names will display correctly (fetched from public_profiles.full_name)
- Fan names will display correctly (no longer blocked by RLS)
- Avatar URLs will be available for display
- The `getCommentAuthorInfo` utility will work correctly with real data
- Profile navigation will work for users with names

## Technical Flow (After Fix)

```text
Comment Render Flow:
┌─────────────────┐
│   Supabase      │
│ public_profiles │ ← RLS allows read
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ full_name found │
│ avatar_url found│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│getCommentAuthor │
│     Info()      │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Artist     Fan
 ├─name     ├─name
 ├─avatar   ├─avatar
 └─/artist/ └─(not navigable per current rule)
   link
```
