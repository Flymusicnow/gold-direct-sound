

# Reduce Comment Avatar Size on Mobile

## Problem
Community comment avatars take up horizontal space that could be used for text content, especially on narrow mobile screens.

## Change
In both `CommentThread.tsx` and `InlineComments.tsx`, change the comment avatar from a fixed `h-6 w-6` (24px) to responsive `h-5 w-5 sm:h-6 sm:w-6` -- 20px on mobile, 24px on desktop.

## Files

| File | Change |
|------|--------|
| `src/components/community/CommentThread.tsx` (line 156) | `h-6 w-6` to `h-5 w-5 sm:h-6 sm:w-6` |
| `src/components/community/InlineComments.tsx` (line 201) | `h-6 w-6` to `h-5 w-5 sm:h-6 sm:w-6` |

This reclaims 4px per comment row on mobile, reducing the chance of text wrapping into narrow columns while keeping full-size avatars on desktop.

