# P0 MANUAL TESTING SCRIPT
## FlyMusic Platform Verification Guide

**Date:** _______________  
**Tester:** _______________  
**Device(s):** _______________

---

## PRE-FLIGHT CHECKLIST

Before starting, ensure:
- [ ] Build passes (check Lovable preview for errors)
- [ ] You have admin account credentials
- [ ] You have fan account credentials  
- [ ] You have artist account credentials
- [ ] Mobile device ready (iPhone preferred for iOS Safari testing)
- [ ] Chrome DevTools mobile emulator available as backup

---

## SECTION 1: MOBILE VIDEO FEED (Critical P0)

### Test Setup
1. Login as **fan** on mobile device
2. Navigate to `/fan/feed` (Your Feed)

### 1.1 Video Layout Tests

| Test | Steps | Expected | ✅/❌ |
|------|-------|----------|-------|
| Video fits viewport | Open feed, look at any video | Video fills width, no horizontal scroll | |
| No pinch-zoom needed | Try to view video content | All content visible without zooming | |
| Aspect ratio | Check video dimensions | 9:16 portrait ratio maintained | |
| No overflow | Scroll horizontally | Page should not scroll horizontally | |

### 1.2 Autoplay Behavior Tests

| Test | Steps | Expected | ✅/❌ |
|------|-------|----------|-------|
| No autoplay on entry | Open `/fan/feed` fresh | No video starts playing automatically | |
| Single video plays | Scroll to center a video | Only that video plays, others are paused | |
| Pause on scroll away | Scroll video out of view | Video pauses when <75% visible | |
| Play on scroll to | Scroll new video to center | New video starts, previous stops | |

### 1.3 iOS Safari Specific

| Test | Steps | Expected | ✅/❌ |
|------|-------|----------|-------|
| Inline playback | Tap play on video | Video plays inline, not fullscreen | |
| Muted autoplay | Scroll video to center | Video can autoplay when muted | |

### Video Feed Notes:
```
Issues found:


```

---

## SECTION 2: COMMENT UI (Critical P0)

### Test Setup
1. Navigate to any artist profile with comments
2. Routes to test: `/artist/:id`, video comments

### 2.1 Comment Display Tests

| Test | Steps | Expected | ✅/❌ |
|------|-------|----------|-------|
| Long comment wrapping | Find/create long comment | Text wraps, no horizontal overflow | |
| Emoji display | View comment with emojis | Emojis render correctly | |
| Reply threading | View nested replies | Indentation shows thread depth | |
| Timestamps | Check comment times | Relative times display correctly | |

### 2.2 Comment Interaction Tests

| Test | Steps | Expected | ✅/❌ |
|------|-------|----------|-------|
| Like button size | Tap like button | Easy to tap (44px target) | |
| Like feedback | Tap like | Instant visual feedback, count updates | |
| Reply button size | Tap reply button | Easy to tap (44px target) | |
| Reply opens input | Tap reply | Reply input appears | |
| Emoji picker | Tap emoji button | Picker opens, usable on mobile | |
| Keyboard behavior | Focus comment input | Keyboard doesn't hide input/send | |
| Submit comment | Type and submit | Comment posts, appears in list | |

### 2.3 Touch Target Verification

Using browser DevTools or by feel:
- [ ] Like button: min 44x44px
- [ ] Reply button: min 44x44px  
- [ ] Emoji button: accessible
- [ ] Submit button: easy to tap

### Comment UI Notes:
```
Issues found:


```

---

## SECTION 3: MOBILE NAVIGATION (Critical P0)

### Test Setup
Test as each role: Fan, Artist, Admin

### 3.1 Fan Navigation (`/fan/*`)

| Route | Back Nav? | Dead End? | Header OK? | ✅/❌ |
|-------|-----------|-----------|------------|-------|
| `/fan` | N/A (home) | No | Yes | |
| `/fan/feed` | Yes | No | Yes | |
| `/fan/artists` | Yes | No | Yes | |
| `/fan/playlists` | Yes | No | Yes | |
| `/fan/achievements` | Yes | No | Yes | |
| `/fan/settings` | Yes | No | Yes | |

### 3.2 Artist Navigation (`/studio/*`)

| Route | Back Nav? | Dead End? | Header OK? | ✅/❌ |
|-------|-----------|-----------|------------|-------|
| `/studio` | N/A (home) | No | Yes | |
| `/studio/tracks` | Yes | No | Yes | |
| `/studio/videos` | Yes | No | Yes | |
| `/studio/analytics` | Yes | No | Yes | |
| `/studio/promo` | Yes | No | Yes | |
| `/studio/earnings` | Yes | No | Yes | |
| `/studio/settings` | Yes | No | Yes | |

### 3.3 General Navigation

| Test | Steps | Expected | ✅/❌ |
|------|-------|----------|-------|
| Bottom nav visible | Check any page | Nav bar at bottom, not clipped | |
| Active state | Tap nav items | Current page highlighted | |
| No horizontal scroll | Swipe horizontally | Page doesn't scroll sideways | |
| Safe area respected | Check on notched iPhone | Content not under notch | |

### Navigation Notes:
```
Issues found:


```

---

## SECTION 4: ADMIN NAVIGATION (Critical P0)

### Test Setup
1. Login as **admin**
2. Navigate to `/admin`

### 4.1 Admin Routes (No 404s)

| Route | Loads? | Back Nav? | Layout OK? | ✅/❌ |
|-------|--------|-----------|------------|-------|
| `/admin` | Yes | N/A | Yes | |
| `/admin/users` | Yes | Yes | Yes | |
| `/admin/users/:id` | Yes | Yes | Yes | |
| `/admin/artists` | Yes | Yes | Yes | |
| `/admin/approvals` | Yes | Yes | Yes | |
| `/admin/tracks` | Yes | Yes | Yes | |
| `/admin/smart-links` | Yes | Yes | Yes | |
| `/admin/spotlight` | Yes | Yes | Yes | |
| `/admin/spotlight/entries` | Yes | Yes | Yes | |
| `/admin/campaigns` | Yes | Yes | Yes | |
| `/admin/collab-entities` | Yes | Yes | Yes | |
| `/admin/matching` | Yes | Yes | Yes | |
| `/admin/brand-applications` | Yes | Yes | Yes | |
| `/admin/payouts` | Yes | Yes | Yes | |
| `/admin/features` | Yes | Yes | Yes | |
| `/admin/beta-codes` | Yes | Yes | Yes | |
| `/admin/updates` | Yes | Yes | Yes | |
| `/admin/activity-log` | Yes | Yes | Yes | |
| `/admin/roles` | Yes | Yes | Yes | |
| `/admin/qa` | Yes | Yes | Yes | |

### 4.2 Admin Mobile Usability

| Test | Steps | Expected | ✅/❌ |
|------|-------|----------|-------|
| Mobile menu opens | Tap hamburger/more | Menu sheet opens | |
| Menu scrollable | Scroll in menu | All items accessible | |
| No auto-keyboard | Open menu | Keyboard doesn't auto-open | |
| Close menu | Tap outside or X | Menu closes | |

### Admin Navigation Notes:
```
Issues found:


```

---

## SECTION 5: ADMIN DATA TRUTH (Critical P0)

### Test Setup
1. Open Supabase/database to get real counts
2. Compare with Admin Dashboard

### 5.1 Dashboard Stats Verification

First, get actual counts from database:

```sql
-- Run these queries to get truth values
SELECT COUNT(*) FROM profiles;  -- Total Users: ____
SELECT COUNT(*) FROM artist_profiles WHERE status = 'approved';  -- Artists: ____
SELECT COUNT(*) FROM tracks;  -- Tracks: ____
SELECT COUNT(*) FROM artist_profiles WHERE status = 'pending';  -- Pending: ____
```

| Stat Card | DB Value | Dashboard Shows | Match? | ✅/❌ |
|-----------|----------|-----------------|--------|-------|
| Total Users | ____ | ____ | | |
| Pending Approvals | ____ | ____ | | |
| Artists | ____ | ____ | | |
| Tracks | ____ | ____ | | |

### 5.2 User Detail Page Verification

Pick a user with known data:
- User ID: ____________________
- Expected tracks: ____
- Expected videos: ____
- Expected comments: ____

| Field | Expected | Shows | Match? | ✅/❌ |
|-------|----------|-------|--------|-------|
| Role | ____ | ____ | | |
| Tracks count | ____ | ____ | | |
| Videos count | ____ | ____ | | |
| Comments count | ____ | ____ | | |

### 5.3 Users List Roles Column

| User | Actual Role | Shows As | Correct? | ✅/❌ |
|------|-------------|----------|----------|-------|
| User 1 | ____ | ____ | | |
| User 2 | ____ | ____ | | |
| User 3 | ____ | ____ | | |

### Data Truth Notes:
```
Issues found:


```

---

## SECTION 6: QA MODE VERIFICATION

### Test Setup
1. Navigate to `/admin/qa`

### 6.1 Route Health Checks

| Section | All Green? | Failed Routes | ✅/❌ |
|---------|------------|---------------|-------|
| Admin Routes | | | |
| Fan Routes | | | |
| Artist Routes | | | |
| Public Routes | | | |

### 6.2 Database Health Checks

| Table | Has Data? | Response Time OK? | ✅/❌ |
|-------|-----------|-------------------|-------|
| profiles | | | |
| user_roles | | | |
| tracks | | | |
| runtime_errors | | | |

### 6.3 Mobile Preview

| Device | Page | Renders OK? | ✅/❌ |
|--------|------|-------------|-------|
| iPhone SE | /fan | | |
| iPhone 14 | /fan/feed | | |
| Android | /studio | | |

### 6.4 Error Monitoring

- [ ] No new P0 errors in runtime_errors table
- [ ] Sentry (if configured) shows no new critical errors

### QA Mode Notes:
```
Issues found:


```

---

## SECTION 7: SMART LINKS PHASE 6 (New)

### 7.1 Rate Limiting

| Test | Steps | Expected | ✅/❌ |
|------|-------|----------|-------|
| Rate limit check | Make 11 link edits in one day | 11th should be blocked | |
| Audit logging | Edit a link, check audit_log | Action recorded with role | |

### 7.2 Admin Notifications

| Test | Steps | Expected | ✅/❌ |
|------|-------|----------|-------|
| Flagged link trigger | Add suspicious URL | Admin notification created | |

---

## FINAL P0 SIGN-OFF

### Summary

| Section | Status | Blocking Issues |
|---------|--------|-----------------|
| 1. Video Feed | ⬜ Pass / ⬜ Fail | |
| 2. Comment UI | ⬜ Pass / ⬜ Fail | |
| 3. Mobile Nav | ⬜ Pass / ⬜ Fail | |
| 4. Admin Nav | ⬜ Pass / ⬜ Fail | |
| 5. Data Truth | ⬜ Pass / ⬜ Fail | |
| 6. QA Mode | ⬜ Pass / ⬜ Fail | |
| 7. Smart Links | ⬜ Pass / ⬜ Fail | |

### P0 Decision

- [ ] **ALL SECTIONS PASS** → P0 CAN BE CLOSED
- [ ] **ANY SECTION FAILS** → P0 REMAINS OPEN

### Blocking Items (if any):
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

**Verified by:** _______________  
**Date:** _______________  
**Build/Version:** _______________
