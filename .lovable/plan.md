

# Bugfix-plan: Missions Progress Not Updating + UI Visibility Issue

## Summary of Issues

| Issue | Root Cause | Severity |
|-------|------------|----------|
| 1. Mission progress not updating after liking tracks | Race condition: `missions` array empty when `updateMissionProgress` called | **Critical** |
| 2. First mission card not fully visible on mobile | Layout/scroll issue with tabs | Medium |
| 3. HTTP 406 errors on spotlight_campaigns | Using `.single()` instead of `.maybeSingle()` | Medium |

---

## Issue 1: Mission Progress Race Condition (Critical)

### Problem Analysis

**Evidence from database:**
- User `90fb1bae-3b01-45b8-b843-1a51e5005b5a` liked 5 tracks on 2026-01-09
- User has **0 mission_completions records** - progress was never saved

**Code flow:**
```text
LikesProvider mounts
       │
       ├── useMissions() called → starts fetching missions (async)
       │
       ▼
User likes track (before missions loaded)
       │
       ▼
updateMissionProgress('daily_like_tracks') called
       │
       ▼
missions.find() returns undefined (missions array still empty)
       │
       ▼
Function returns early without saving progress ❌
```

**File:** `src/hooks/useMissions.ts` (lines 75-76)
```typescript
const mission = missions.find(m => m.mission_key === missionKey);
if (!mission) return;  // Silently fails if missions not loaded
```

### Solution

Modify `updateMissionProgress` to fetch the mission directly from database if not found in local state:

**New code for `src/hooks/useMissions.ts`:**
```typescript
const updateMissionProgress = useCallback(async (missionKey: string, increment: number = 1) => {
  if (!user) return;

  // Try to find mission in local state first
  let mission = missions.find(m => m.mission_key === missionKey);
  
  // If not found (race condition), fetch directly from database
  if (!mission) {
    console.log(`[useMissions] Mission ${missionKey} not in state, fetching from DB`);
    const { data, error } = await supabase
      .from('missions')
      .select('*')
      .eq('mission_key', missionKey)
      .eq('is_active', true)
      .maybeSingle();
    
    if (error || !data) {
      console.error('[useMissions] Failed to fetch mission:', error);
      return null;
    }
    mission = data as Mission;
  }

  // ... rest of the function continues unchanged
}, [user, missions, progress]);
```

This ensures mission progress is always recorded, even if the user acts before missions finish loading.

---

## Issue 2: First Mission Card Partially Hidden (Mobile)

### Problem Analysis

User reported: "I couldn't see the full first mission"

**Current layout in `FanMissions.tsx`:**
```text
┌─────────────────────────┐
│  MobileFanNav (fixed)   │  pt-16
├─────────────────────────┤
│  PageBreadcrumb         │
│  Header + BoostToken    │
│  Info Card              │
│  ┌───────────────────┐  │
│  │ TabsList (sticky) │  │  ← May overlap with content below
│  ├───────────────────┤  │
│  │ First Mission Card│  │  ← User can't see this fully
│  │ ...               │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### Solution

Add spacing between TabsList and first content item in `MissionsList.tsx`:

**File:** `src/components/missions/MissionsList.tsx`

Change line 39 from:
```tsx
<TabsContent value="daily" className="space-y-3 mt-0">
```

To:
```tsx
<TabsContent value="daily" className="space-y-3 mt-2">
```

And line 50 from:
```tsx
<TabsContent value="weekly" className="space-y-3 mt-0">
```

To:
```tsx
<TabsContent value="weekly" className="space-y-3 mt-2">
```

This adds a small margin between the tabs and the first mission card.

---

## Issue 3: HTTP 406 Errors (spotlight_campaigns)

### Problem Analysis

Error logs show repeated HTTP 406 errors:
```
/rest/v1/spotlight_campaigns?select=id%2Cname&status=eq.active
```

Per memory `technical/spotlight-campaign-query-resilience`, this happens when using `.single()` instead of `.maybeSingle()`.

### Solution

Search and replace `.single()` with `.maybeSingle()` for spotlight_campaigns queries:

**File:** `src/pages/admin/AdminSpotlightEntries.tsx` (line 59)
```typescript
// Before
.eq('id', campaignId).single(),

// After
.eq('id', campaignId).maybeSingle(),
```

Also need to search for other files that might have this issue.

---

## Files to Modify

| File | Change | Priority |
|------|--------|----------|
| `src/hooks/useMissions.ts` | Add fallback database fetch in updateMissionProgress | **High** |
| `src/components/missions/MissionsList.tsx` | Add `mt-2` to TabsContent | Medium |
| `src/pages/admin/AdminSpotlightEntries.tsx` | Change `.single()` to `.maybeSingle()` | Medium |
| Search for other `.single()` usages | Update as needed | Medium |

---

## Technical Implementation

```text
1. useMissions.ts - Fix race condition
           │
           ▼
2. MissionsList.tsx - Add spacing
           │
           ▼
3. Search & fix .single() → .maybeSingle()
           │
           ▼
4. Test with quick likes after page load
```

---

## Definition of Done

- [ ] Mission progress updates even when liking immediately after page load
- [ ] First mission card fully visible on mobile
- [ ] No HTTP 406 errors for spotlight_campaigns queries
- [ ] Console logs show "Mission not in state, fetching from DB" when race condition occurs

