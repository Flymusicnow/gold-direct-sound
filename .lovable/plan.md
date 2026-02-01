
# Plan: Add "Don't Show This Again" Option to Onboarding Tour

## Problem

Varje gång användaren går till Fan Portal visas onboarding-dialogen igen eftersom "Let's Go!"-knappen bara stänger dialogen utan att spara preferensen i databasen.

## Lösning

Lägg till en "Don't show this again"-checkbox i dialogen. När användaren bockar i den och stänger dialogen sparas detta som `onboarding_skipped: true` i databasen.

## Tekniska Ändringar

### Fil: `src/components/fan/FanOnboardingTour.tsx`

1. **Lägg till state för checkbox**
```typescript
const [dontShowAgain, setDontShowAgain] = useState(false);
```

2. **Uppdatera "Let's Go!"-knappens onClick**
```typescript
const handleLetsGo = async () => {
  if (dontShowAgain && user) {
    await supabase
      .from('fan_onboarding_progress')
      .upsert({
        user_id: user.id,
        onboarding_skipped: true,
      });
  }
  setOpen(false);
};
```

3. **Lägg till checkbox i UI (före action buttons)**
```tsx
<div className="flex items-center gap-2">
  <Checkbox 
    id="dont-show" 
    checked={dontShowAgain}
    onCheckedChange={(checked) => setDontShowAgain(checked === true)}
  />
  <label htmlFor="dont-show" className="text-sm text-muted-foreground cursor-pointer">
    Don't show this again
  </label>
</div>
```

4. **Import Checkbox component**
```typescript
import { Checkbox } from '@/components/ui/checkbox';
```

## Sammanfattning

| Ändring | Varför |
|---------|--------|
| Lägg till `dontShowAgain` state | Spåra checkbox-status |
| Ny `handleLetsGo` funktion | Spara preferens om checkbox är ibockad |
| Checkbox i UI | Ge användaren valet att dölja dialogen permanent |

## Filer att Ändra

1. `src/components/fan/FanOnboardingTour.tsx` - Lägg till checkbox och logik för att spara preferensen
