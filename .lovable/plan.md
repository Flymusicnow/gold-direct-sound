
# Opportunities Page — Cinematic Parallax Upgrade

## What Exists Now

`StudioOpportunities.tsx` renders a standard 2-column Card grid. No parallax, no Netflix rows, no cinematic background. The CSS system already has `.interactive-card`, `.label-premium`, `.modal-bounce`, and the gold shimmer system — but none are applied here.

The `main` element is already a scroll container (`overflow-y-auto`) with ref-addressable structure.

---

## What Changes

### File 1: `src/pages/studio/StudioOpportunities.tsx`

**A — Parallax scroll handler (performance-safe)**

Add `useRef` for the `<main>` element and a RAF-gated scroll listener. No `useState` for scrollY — updates are applied directly to DOM element style refs to avoid re-renders:

```tsx
const mainRef = useRef<HTMLElement>(null);
const sectionRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
const scrollY = useRef(0);
const ticking = useRef(false);

useEffect(() => {
  const el = mainRef.current;
  if (!el) return;
  const update = () => {
    ticking.current = false;
    const y = scrollY.current;
    sectionRefs[1].current?.style.setProperty('transform', `translateY(${y * -0.008}px)`);
    sectionRefs[2].current?.style.setProperty('transform', `translateY(${y * -0.016}px)`);
  };
  const onScroll = () => {
    scrollY.current = el.scrollTop;
    if (!ticking.current) { requestAnimationFrame(update); ticking.current = true; }
  };
  el.addEventListener('scroll', onScroll, { passive: true });
  return () => el.removeEventListener('scroll', onScroll);
}, []);
```

**B — Cinematic wrapper**

Wrap the `<main>` content area with `.opportunities-bg` and `position: relative; z-index: 1` so content sits above the `::before` crimson gradient.

**C — Netflix row grouping logic**

Replace the flat grid with 4 grouped sections. Each section is a horizontal scroll row:

```tsx
const grouped = {
  recommended: sortedOpportunities.slice(0, 8),
  liveEvents: sortedOpportunities.filter(o => ['live_event', 'festival_slot'].includes(o.type)),
  brandDeals: sortedOpportunities.filter(o => ['brand_deal', 'sponsorship', 'ugc_content'].includes(o.type)),
  partnerships: sortedOpportunities.filter(o => o.type === 'partnership'),
};
```

Only render a section if it has items. "Recommended" always shows (it's the top 8 by score).

**D — Section title 3D treatment**

Each section header gets `.section-title-3d label-premium` classes.

**E — Card structure inside rows**

Each card is a fixed-width (`w-72 md:w-80`) flex-shrink-0 snap card. The "Apply Now" button always has a gold border-bottom underline (`.card-cta`) so it's never passive — it reads as actionable without hover. Applied state renders a disabled "Applied ✓" button instead.

The match score badge remains in the top-right corner of each card.

**F — Row darkening overlay on hover**

Each row section has a `group` class. When any card within it is hovered, the row gets a `group-hover:bg-black/5` overlay — subtle, not dramatic.

---

### File 2: `src/index.css`

Add the following new utility classes inside the existing `@layer components` block (before the closing `}`):

```css
/* ============================================
   Opportunities — Cinematic Background
   ============================================ */
.opportunities-bg {
  --opp-bg: #0D0D0F;
  --opp-crimson: #5A0F1B;
  --opp-gold: #E8BF1A;
  --opp-text: #F5F3ED;
  background: var(--opp-bg);
  color: var(--opp-text);
  position: relative;
  overflow-x: hidden;
}

.opportunities-bg::before {
  content: '';
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at 30% 20%, var(--opp-crimson) 0%, transparent 60%);
  opacity: 0.4;
  pointer-events: none;
  z-index: 0;
  filter: blur(30px);
}

/* 3D sculpted section titles */
.section-title-3d {
  color: #F5F3ED;
  text-shadow:
    0 1px 0 hsla(45, 65%, 50%, 0.25),
    0 0 6px hsla(45, 65%, 50%, 0.12);
  letter-spacing: 0.02em;
}

/* Netflix horizontal snap row */
.netflix-row {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  gap: 1rem;
  padding-bottom: 0.5rem;
  -webkit-overflow-scrolling: touch;
}
.netflix-row::-webkit-scrollbar { height: 4px; }

.netflix-row-card {
  scroll-snap-align: start;
  flex-shrink: 0;
  width: 280px;
}
@media (min-width: 768px) {
  .netflix-row-card { width: 320px; }
}

/* Card CTA — always-visible gold underline */
.card-cta {
  border-bottom: 2px solid var(--opp-gold, #E8BF1A);
  padding-bottom: 2px;
  display: inline-block;
}

/* Opportunities card hover treatment */
.opp-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  transition: all 350ms cubic-bezier(0.22, 1, 0.36, 1);
  cursor: pointer;
}

.opp-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow:
    0 10px 30px rgba(0,0,0,0.5),
    0 0 12px hsla(45, 65%, 50%, 0.18);
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .opp-card:hover { transform: none; box-shadow: none; }
  .section-title-3d { text-shadow: none; }
  .opportunities-bg::before { display: none; }
}
```

---

## Files to Change

| File | Change |
|------|--------|
| `src/pages/studio/StudioOpportunities.tsx` | Add parallax scroll handler, cinematic wrapper class, Netflix row grouping, 3D section titles, card CTA underline, always-visible Apply Now |
| `src/index.css` | Add `.opportunities-bg`, `.section-title-3d`, `.netflix-row`, `.netflix-row-card`, `.card-cta`, `.opp-card` with reduced-motion support |

## What Does NOT Change

- No data queries modified
- No match score logic touched
- No `ApplyToOpportunityDialog` changes
- No role or identity logic
- My Applications tab unchanged
- Wave 1 foundation intact
- All existing CSS classes preserved

## Result

- Deep charcoal + muted crimson radial glow behind the page
- Horizontal snap-scroll rows grouped by category (Recommended, Live Events, Brand Deals, Partnerships)
- Section titles with sculpted gold text-shadow depth
- Cards lift and glow gold on hover with elastic easing
- "Apply Now" has a permanent gold underline — never passive
- Performance-safe scroll handler via RAF — no re-renders from scroll events
- Full `prefers-reduced-motion` support
