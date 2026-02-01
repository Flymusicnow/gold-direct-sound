
# Fix: Select Dropdown Not Working Inside Dialogs

## Problem

When clicking on "Typ av lösning" dropdown in the QuickResolveDialog, nothing happens. The dropdown is being rendered BEHIND the dialog overlay.

## Root Cause

**Z-index mismatch:**
- Dialog overlay: `z-[150]`
- Dialog content: `z-[150]`  
- SelectContent: `z-50`

Since SelectContent uses a Portal (renders to body), and its z-index (50) is lower than the Dialog's z-index (150), the dropdown appears behind the dialog and cannot be clicked.

## Solution

Update the SelectContent component to use `z-[200]` instead of `z-50`, ensuring it always appears above dialogs and other overlays.

## Technical Changes

### File: `src/components/ui/select.tsx`

**Line 69 - Change z-index:**
```typescript
// Before
"relative z-50 max-h-96 min-w-[8rem] overflow-hidden..."

// After  
"relative z-[200] max-h-96 min-w-[8rem] overflow-hidden..."
```

This single change will fix the dropdown in:
- QuickResolveDialog
- ReportIssueDialog  
- Any other Select inside a Dialog

## Z-Index Hierarchy (After Fix)

| Component | Z-Index |
|-----------|---------|
| Base content | 0-49 |
| Standard popovers | z-50 |
| Toast notifications | z-[100] |
| Dialog overlay & content | z-[150] |
| **SelectContent (fixed)** | **z-[200]** |

## Files to Edit

1. `src/components/ui/select.tsx` - Update SelectContent z-index from `z-50` to `z-[200]`
