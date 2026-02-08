

# Fix: Mobile Layout Inconsistency Between Lovable Preview and External Window

## Root Cause

`src/App.css` is **never imported** anywhere in the application. Not in `main.tsx`, not in `App.tsx`, not anywhere. It is dead code.

This means the following critical rules are never applied:

```css
html, body {
  height: 100%;
  overflow: hidden;   /* <-- scroll-lock for FlightdeckLayout */
}

#root {
  height: 100%;       /* <-- h-screen chain for FlightdeckLayout */
}
```

**Why it looks correct in the Lovable preview:** The Lovable preview panel renders your app inside an iframe with its own height/overflow constraints on the wrapper element. This accidentally masks the missing `overflow: hidden` and `height: 100%` rules. In a separate browser tab, there is no wrapper -- the app runs directly on the page, and without those rules the FlightdeckLayout scroll model breaks.

**Why the img fix also doesn't apply externally:** The `img { max-width: 100%; display: block; }` rule from App.css (the cover image fix) is also dead. However, Tailwind's preflight (loaded via `@tailwind base` in index.css) already sets identical img defaults, so this specific rule is redundant and not the cause.

## Fix

### Merge App.css into index.css (single source of truth)

Rather than just adding an import (which leaves two global CSS files -- confusing and error-prone), merge the non-redundant rules from `App.css` into `index.css` and delete `App.css`.

**What App.css currently has:**

| Rule | Already in index.css / Tailwind? | Action |
|------|----------------------------------|--------|
| `*, *::before, *::after { box-sizing: border-box }` | Yes (Tailwind preflight) | Skip (redundant) |
| `video, canvas { max-width: 100%; height: auto; display: block }` | Partially (Tailwind handles video but not canvas) | Keep for canvas |
| `img { max-width: 100%; display: block }` | Yes (Tailwind preflight) | Skip (redundant) |
| `html, body { height: 100%; margin: 0; padding: 0; overflow: hidden }` | Partially (index.css has Safari viewport sizing, Tailwind preflight has margin/padding reset) | **Keep height + overflow** |
| `#root { height: 100% }` | No | **Keep** |

**File: `src/index.css`**

Add the missing critical rules at the top of the file (before `@tailwind base`):

```css
/* App-wide scroll lock -- keeps FlightdeckLayout as the sole scroll container */
html, body {
  height: 100%;
  overflow: hidden;
}

#root {
  height: 100%;
}

/* Canvas element safety reset */
canvas { max-width: 100%; height: auto; display: block; }

@tailwind base;
@tailwind components;
@tailwind utilities;
/* ... rest of index.css unchanged ... */
```

Placing them before `@tailwind base` ensures they load first, then Tailwind's preflight layer adds its own resets on top without conflict. The `overflow: hidden` and `height: 100%` rules are not covered by Tailwind, so they survive.

**File: `src/App.css`**

Delete this file entirely. All its rules are now either in `index.css` or already covered by Tailwind's preflight.

## Why This Fixes the Problem

```text
Before (external tab):
  html/body -> no height, no overflow:hidden
    -> body scrolls freely
    -> FlightdeckLayout h-screen has no reference height
    -> layout breaks, content overflows, double scrollbars

After (external tab):
  html/body -> height:100%, overflow:hidden
    -> no body scroll
    -> FlightdeckLayout h-screen = viewport height
    -> <main> is the sole scroll container (overflow-y-auto)
    -> layout matches Lovable preview exactly
```

## Files Summary

| File | Action | Change |
|------|--------|--------|
| `src/index.css` | Modify | Add scroll-lock rules (height: 100%, overflow: hidden on html/body, height: 100% on #root) and canvas reset at the top |
| `src/App.css` | Delete | All rules are now redundant or merged into index.css |

## What's NOT Changing

- TrackCard dimensions or thumbnail styling (already fixed in previous commit)
- FlightdeckLayout structure (already has overflow-x-hidden)
- FanFeed page structure (already has overflow-x-hidden and touch-action)
- Tailwind config or Vite config
- index.html viewport meta tag (already correct: `viewport-fit=cover`)

