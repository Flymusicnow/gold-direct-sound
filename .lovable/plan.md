
# Bugfix Plan: Three User-Reported Issues

## Summary of Issues

| # | Issue | Route | Root Cause | Priority |
|---|-------|-------|------------|----------|
| 1 | Comment names not clickable for profile navigation | `/post/{id}` | Click events may need `e.stopPropagation()` | High |
| 2 | No Edit track button | `/studio/tracks` | Edit button exists but only shows icon (no label) | Medium |
| 3 | Music player blocked when video open | `/artist/{id}` | Known UX constraint (noted as acceptable) | Low |

---

## Issue 1: Comment Names Not Clickable

### Problem
User reports: "Man kan inte klicka på Namnen i kommentarsfältet för att komma till profilen" (You can't click on names in the comment field to navigate to the profile)

### Analysis
Looking at `CommentThread.tsx` (lines 154-159), the author name is rendered as a clickable button:
```tsx
<button 
  onClick={() => onProfileClick(comment.author_id, identity)}
  className="text-sm font-medium hover:text-primary hover:underline cursor-pointer transition-colors"
>
  {displayName}
</button>
```

The `handleProfileClick` function (lines 296-302) navigates correctly:
```tsx
const handleProfileClick = (authorId: string, identity: AuthorIdentity | undefined) => {
  if (identity?.artistProfileId) {
    navigate(`/artist/${identity.artistProfileId}`);
  } else {
    navigate(`/fan/profile/${authorId}`);
  }
};
```

**Root cause**: The click event may be bubbling up to parent elements that capture or prevent the navigation. Per the Stack Overflow solution provided, adding `e.stopPropagation()` should fix this.

### Solution

**File:** `src/components/community/CommentThread.tsx`

**Change lines 154-159:**
```tsx
// Before:
<button 
  onClick={() => onProfileClick(comment.author_id, identity)}
  className="text-sm font-medium hover:text-primary hover:underline cursor-pointer transition-colors"
>
  {displayName}
</button>

// After:
<button 
  onClick={(e) => {
    e.stopPropagation();
    onProfileClick(comment.author_id, identity);
  }}
  className="text-sm font-medium hover:text-primary hover:underline cursor-pointer transition-colors"
>
  {displayName}
</button>
```

---

## Issue 2: No Edit Track Button

### Problem
User reports: "Finns ingen Edit track knapp?" (Is there no Edit track button?)

### Analysis
Looking at `StudioTracks.tsx`, the edit functionality EXISTS in `TrackRow` (lines 885-893):
```tsx
<Button
  size="icon"
  variant="ghost"
  onClick={onEditMetadata}
  className="flex-shrink-0"
  title="Edit track details"
>
  <Pencil className="h-4 w-4" />
</Button>
```

**Root cause**: The button only displays a Pencil icon without a text label. Users expect a button that says "Edit" or "Edit Track" - the icon-only design is not discoverable.

### Solution

**File:** `src/pages/studio/StudioTracks.tsx`

**Change 1 - TrackRow component (lines 885-893):**
```tsx
// Before:
<Button
  size="icon"
  variant="ghost"
  onClick={onEditMetadata}
  className="flex-shrink-0"
  title="Edit track details"
>
  <Pencil className="h-4 w-4" />
</Button>

// After:
<Button
  size="sm"
  variant="outline"
  onClick={onEditMetadata}
  className="flex-shrink-0 gap-1"
>
  <Pencil className="h-4 w-4" />
  <span className="hidden sm:inline">Edit</span>
</Button>
```

**Change 2 - SortableTrackRow component (lines 794-802):**
Same change pattern - add text label that shows on larger screens.

---

## Issue 3: Music Player Blocked When Video Open

### Problem
User reports: "Man kan inte heller pausa eller spela musiken manuellt om video rutan är uppe. Rutan måste stängas om man ska röra musik spelaren."

### Analysis
This is an existing, intentional UX decision documented in the architecture memories:
- `architecture/global-playback-and-audio-focus-protocol`: Starting a video pauses music, and vice versa
- The floating video player uses a backdrop that may block some interactions

### Recommendation
Per the user's suggestion ("Paus play skulle va nice ändå kanske"), this is a valid enhancement request but not a bug. The current behavior is by design to ensure audio focus consistency.

**Status**: Document as enhancement request (not included in this bugfix plan)

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/community/CommentThread.tsx` | Add `e.stopPropagation()` to name click handler |
| `src/pages/studio/StudioTracks.tsx` | Add "Edit" text label to edit buttons in both TrackRow and SortableTrackRow |

---

## Technical Summary

```text
Issue 1: Comment Names
  └─ CommentThread.tsx line 154-159
     └─ Add e.stopPropagation() to prevent event bubbling

Issue 2: Edit Button
  └─ StudioTracks.tsx
     ├─ TrackRow lines 885-893
     │  └─ Change from icon-only to icon+label button
     └─ SortableTrackRow lines 794-802
        └─ Same change
```
