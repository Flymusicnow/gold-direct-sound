
# UI Vision: "FlyMusic Poppar" — Premium Motion Upgrade

## Analys av nuläget

FlyMusic har redan ett sofistikerat designsystem:
- Gold-färgpalett med HSL-tokens
- `interactive-card`, `menu-item-premium`, `list-row-premium`, `btn-gold-premium` CSS-klasser
- Framer Motion på feeds och PageTransition
- Gold shimmer-animationer på skeletons och tickets

Men dessa klasser används **inte konsekvent** genom hela appen. Och flera begärda element saknas:
- Ingen Montserrat/Poppins — bara Playfair Display och Inter
- Ingen `bounce`-effekt på knapptryckningar
- Ingen gold focus-ring på Input-komponenten
- Inga "living text"-hover-effekter på interaktiva etiketter
- Cards i feeden saknar `.interactive-card`-klassen

Det här är ett **design-system consistency pass** — vi lägger till det som fattas och kopplar ihop de klasser som redan finns.

---

## Vad vi bygger

### 1. Typografi: Lägg till Montserrat

Playfair Display används för premium-rubriker. Vi byter INTE — men lägger till **Montserrat** som alternativt display-typsnitt för UI-etiketter (nav, knappar, filter-chips). Inter behålls för brödtext.

**Ändring i `index.html`:** Lägg till Montserrat-fonten från Google Fonts.
**Ändring i `tailwind.config.ts`:** Lägg till `'montserrat'` i `fontFamily`.
**Ändring i `index.css`:** Ny utility-klass `.label-premium` med Montserrat för UI-etiketter.

### 2. Input-komponenten: Gold Focus Ring

Nuläget: standard Tailwind `ring-ring` (guld men ingen glow).
Nytt: Gold focus-ring med glow-shadow + smooth border-color transition.

**Ändring i `src/components/ui/input.tsx`:**
```tsx
// Ersätt focus-visible klasserna med:
"border-input transition-all duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-0 focus-visible:border-primary/60 focus-visible:shadow-[0_0_12px_hsla(45,82%,51%,0.15)]"
```

### 3. Button: Bounce/Press-effekt

Nuläget: `hover:-translate-y-0.5` — bara lift, ingen press-känsla.
Nytt: Active-state ger `scale(0.97)` + snabb bounce-återgång.

**Ändring i `src/components/ui/button.tsx`:**
Lägg till `active:scale-[0.97] active:shadow-none` på base-klassen och `transition-all` inkluderar `transform`.

### 4. Feed Cards: Koppla `.interactive-card`

`GlobalFeedCard` och liknande kort använder inte `.interactive-card`-klassen, så hover-glow och lift-effekten aktiveras inte. Vi lägger till klassen.

**Ändring i `src/components/feed/GlobalFeedCard.tsx`:** Lägg till `interactive-card` på `motion.div`.

### 5. Index.css: Ny "Living Text"-effekt

Interaktiva etiketter (filter-chips, nav-labels) ska "andas" vid hover. Ny CSS-klass `.text-live`:
- Subtil `letter-spacing`-transition (tight → normal)
- Mjuk opacity-förändring
- Ingen `translateY` — bara känsla av att texten aktiveras

### 6. Index.css: Modal/Drawer Bounce-animation

Nuläget: Modals glider in neutralt (vaul/radix standard).
Ny keyframe `modal-bounce-in`:
```css
@keyframes modal-bounce-in {
  0%   { transform: translateY(100%) scale(0.98); opacity: 0; }
  65%  { transform: translateY(-4%) scale(1.005); opacity: 1; }
  85%  { transform: translateY(1%); }
  100% { transform: translateY(0) scale(1); opacity: 1; }
}
```
Ny klass `.modal-bounce` som kan appliceras på Drawer-innehåll.

### 7. Filter Chips i GlobalFeedFilters: Montserrat + Bounce

Aktiva filter-chips ska kännas responsiva. Lägg till `active:scale-[0.96]` och font-klassen `.label-premium` på chip-texten.

---

## Filer som ändras

| Fil | Ändring |
|-----|---------|
| `index.html` | Lägg till Montserrat i Google Fonts-länken |
| `tailwind.config.ts` | Lägg till `montserrat` i `fontFamily` |
| `src/index.css` | `.label-premium`, `.text-live`, `modal-bounce-in` + `.modal-bounce` |
| `src/components/ui/input.tsx` | Gold focus-ring med glow-shadow |
| `src/components/ui/button.tsx` | `active:scale-[0.97]` press-effekt |
| `src/components/feed/GlobalFeedCard.tsx` | Lägg till `interactive-card` på wrapper-div |
| `src/components/feed/GlobalFeedFilters.tsx` | `active:scale-[0.96]` på chips, `.label-premium` |

---

## Vad som INTE ändras

- Färgpalett — guld och mörk bakgrund behålls exakt
- Befintliga animationsklasser (`ticket-gold-animated`, `btn-gold-premium`, etc.)
- Playfair Display för premium-rubriker
- Inter för brödtext
- Frekvensbegränsningar på animationer (inga blinkande element)
- Existerande Framer Motion-konfiguration

---

## Resultat

Efter dessa ändringar:
- Knappar **bouncar** subtilt vid tryck — ger physical feedback-känsla
- Input-fält får en **gold glow** vid fokus — visuell koppling till varumärket
- Feed-kort aktiverar den befintliga **gold hover-glöden** som redan var designad men inte kopplad
- Nya `Montserrat`-klassen ger UI-etiketter en precision och vikt som kompletterar Playfair
- Modals/Drawers får en **bouncy reveal** som känns levande
- Allt sker inom det befintliga motion-systemets regler: ingen blinkning, inga strobeeffekter, guld glöder mjukt
