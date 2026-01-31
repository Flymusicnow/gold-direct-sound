

# Plan: Gör useLikes defensiv mot saknad kontext

## Problemanalys

Felet `useLikes must be used within a LikesProvider` uppstår när:
1. En provider tidigare i kedjan (`AuthProvider`, `useSupportScore`, etc.) kastar ett fel
2. `LikesProvider` misslyckas att rendera
3. Komponenter som `ArtistProfile` försöker anropa `useLikes()` men får `undefined`

Det här är ett **kaskadfels-mönster** - ett fel någonstans i provider-trädet tar ner hela appen.

## Lösning: Defensiv hook med fallback

Istället för att krascha hela appen när kontexten saknas, returnera en "säker" no-op version:

```text
┌─────────────────────────────────────────────────────────────┐
│  FÖRE: useLikes() kastar fel                                │
│                                                             │
│  if (context === undefined) {                               │
│    throw new Error('useLikes must be used...')  ← CRASH    │
│  }                                                          │
├─────────────────────────────────────────────────────────────┤
│  EFTER: useLikes() returnerar fallback                      │
│                                                             │
│  if (context === undefined) {                               │
│    console.warn('[useLikes] Called outside LikesProvider')  │
│    return {                                                 │
│      likedTracks: {},                                       │
│      isLiked: () => false,                                  │
│      toggleLike: async () => {},  ← No-op                  │
│      isUpdating: () => false,                               │
│      refreshLikes: async () => {},                          │
│    };                                                       │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
```

## Tekniska ändringar

### Fil: `src/contexts/LikesContext.tsx`

1. **Ta bort throw-satsen** i `useLikes()`
2. **Lägg till fallback-objekt** med tomma/no-op funktioner
3. **Logga varning** för debugging utan att krascha appen
4. **Behåll full funktionalitet** när kontexten finns

### Ny kod för useLikes:

```typescript
// Fallback för när kontexten saknas (t.ex. under provider-fel)
const FALLBACK_CONTEXT: LikesContextType = {
  likedTracks: {},
  isLiked: () => false,
  toggleLike: async () => {
    console.warn('[useLikes] toggleLike called without LikesProvider');
  },
  isUpdating: () => false,
  refreshLikes: async () => {},
};

export function useLikes() {
  const context = useContext(LikesContext);
  
  if (context === undefined) {
    // Log warning instead of crashing
    if (process.env.NODE_ENV === 'development') {
      console.warn('[useLikes] Called outside LikesProvider - using fallback');
    }
    return FALLBACK_CONTEXT;
  }
  
  return context;
}
```

## Fördelar

| Före | Efter |
|------|-------|
| Appen kraschar om en provider misslyckas | Appen fortsätter fungera (degraderat) |
| Användaren ser "Something went wrong" | Användaren kan fortsätta navigera |
| Svårt att debugga kaskadfel | Tydlig warning i console |
| Likes-knappar kraschar sidan | Likes-knappar fungerar inte men kraschar inte |

## Alternativ lösning (bonus)

För ännu bättre felhantering kan vi också skapa en `useLikesOptional()` hook:

```typescript
// Returner null istället för fallback om kontexten saknas
export function useLikesOptional() {
  return useContext(LikesContext) ?? null;
}

// Användning i komponenter som vill hantera saknad kontext explicit
const likes = useLikesOptional();
if (!likes) {
  return <div>Likes unavailable</div>;
}
```

## Filer att ändra

| Fil | Ändring |
|-----|---------|
| `src/contexts/LikesContext.tsx` | Gör `useLikes()` defensiv med fallback |

