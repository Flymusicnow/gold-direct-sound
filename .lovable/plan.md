

# Add Event Log to Admin Sidebar

## What's Already Done
- The route `/admin/event-log` is registered in `App.tsx` (line 543)
- It's protected with `ProtectedRoute allowedRoles={['admin', 'super_admin']}`
- The `AdminEventLog` component is imported and exported correctly
- The page itself works -- it just has no navigation link

## What's Missing
The `AdminSidebar.tsx` has no entry for "Event Log" in any section. That's why you can't find it.

## Fix

Add one nav item to the **System** section in `src/components/admin/AdminSidebar.tsx`:

```ts
{
  title: "Event Log",
  url: "/admin/event-log",
  icon: Activity,
  description: "Se senaste user events (play, skip, save, follow, vote). Append-only MVP-logg for debugging"
}
```

This will be inserted into the System section's `items` array, after the existing "Activity Log" entry to keep them grouped logically.

## File Summary

| File | Change |
|------|--------|
| `src/components/admin/AdminSidebar.tsx` | Add "Event Log" nav item to System section |

No database, route, or component changes needed -- everything else is already wired up.

