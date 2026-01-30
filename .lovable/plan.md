
# Plan: Fixa Klickbara Kommentarsnamn

## Problem
I kommentarsfältet på `/post/...` kan man inte klicka på användarnamn för att navigera till deras profil. Rotorsaken är att `fetchAuthorIdentities` i `useAuthorIdentity.ts` frågar `profiles`-tabellen direkt, som har RLS-begränsningar som blockerar åtkomst till andra användares data.

## Rotorsak
Enligt systemets "identity-resolution-privacy-protocol" MÅSTE queries för andra användares identiteter använda `public_profiles`-vyn, inte `profiles`-tabellen.

```text
Nuvarande (FEL):
profiles table → RLS blockerar → null returneras → displayName = "Fan" → isAnonymous = true → ej klickbar

Korrekt:
public_profiles view → tillåter läsning → displayName hämtas → isAnonymous = false → klickbar
```

## Lösning

### Fil: `src/hooks/useAuthorIdentity.ts`

**Ändring 1:** I `fetchAuthorIdentities`-funktionen (rad 183-188), byt ut `profiles` mot `public_profiles`:

```tsx
// FÖRE (rad 183-186):
const { data: profiles } = await supabase
  .from('profiles')
  .select('id, full_name, avatar_url, email')
  .in('id', uniqueIds);

// EFTER:
const { data: profiles } = await supabase
  .from('public_profiles')
  .select('id, full_name, avatar_url')
  .in('id', uniqueIds);
```

**Ändring 2:** Ta bort email-fallback (rad 220-222) eftersom public_profiles inte har email-kolumn:

```tsx
// FÖRE (rad 217-222):
let displayName = 'Fan';
if (profile?.full_name?.trim()) {
  displayName = profile.full_name.trim();
} else if (profile?.email) {
  displayName = profile.email.split('@')[0];
}

// EFTER:
let displayName = profile?.full_name?.trim() || 'Fan';
```

**Ändring 3:** Samma ändring i `useAuthorIdentity` hook (rad 92-107):

```tsx
// FÖRE (rad 92-96):
const { data: profile } = await supabase
  .from('profiles')
  .select('full_name, avatar_url, email')
  .eq('id', authorId)
  .maybeSingle();

// EFTER:
const { data: profile } = await supabase
  .from('public_profiles')
  .select('full_name, avatar_url')
  .eq('id', authorId)
  .maybeSingle();
```

**Ändring 4:** Ta bort email-fallback i single fetch (rad 100-107):

```tsx
// FÖRE:
let displayName = 'Fan';
if (profile?.full_name?.trim()) {
  displayName = profile.full_name.trim();
} else if (profile?.email) {
  displayName = profile.email.split('@')[0];
}

// EFTER:
const displayName = profile?.full_name?.trim() || 'Fan';
```

## Resultat

- Kommentarsnamn blir klickbara för användare med full_name i public_profiles
- Artists navigerar till `/artist/{artistProfileId}`
- Fans navigerar till `/fan/profile/{userId}` (om inte anonyma)
- Anonyma användare (utan namn) förblir icke-klickbara

## Teknisk sammanfattning

```text
useAuthorIdentity.ts
    │
    ├── useAuthorIdentity() hook
    │   └── ÄNDRA: profiles → public_profiles
    │   └── TA BORT: email fallback
    │
    └── fetchAuthorIdentities() batch function
        └── ÄNDRA: profiles → public_profiles
        └── TA BORT: email fallback
```

## Notering om övriga issues

**Issue #2 (Edit track-knapp):** Knappen finns redan i koden (`StudioTracks.tsx` rad 885-893). Den har en penna-ikon (Pencil) och texten "Edit" som är synlig på desktop (hidden på mobil: `hidden sm:inline`).

**Issue #3 (Musikspelare blockerad):** Detta är avsiktligt beteende enligt "global-playback-and-audio-focus-protocol" - video och musik är ömsesidigt uteslutande. En enhancement för att tillåta parallell kontroll skulle kräva en större arkitekturändring.
