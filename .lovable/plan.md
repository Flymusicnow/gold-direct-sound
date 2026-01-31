
# Plan: Mobil-kompatibel Lyrics Centering

## Problemanalys

Varför det inte fungerar på mobilen:

1. **`offsetTop` mäter fel** - Den mäter från inner `div` (med `py-32`), inte från scroll container
2. **Animation timing** - `motion.div` animerar från `height: 0` till `height: auto` - scroll-beräkningen körs innan layouten är klar
3. **Safari scroll-smooth** - CSS `scroll-smooth` fungerar inte pålitligt på iOS Safari

## Lösning

### 1. Använd `getBoundingClientRect()` istället för `offsetTop`

`getBoundingClientRect()` är mer pålitlig cross-browser och ger exakt position relativt till viewport:

```typescript
const containerRect = container.getBoundingClientRect();
const lineRect = activeLine.getBoundingClientRect();

// Beräkna hur mycket vi behöver scrolla för att centrera
const scrollOffset = lineRect.top - containerRect.top - (containerRect.height / 2) + (lineRect.height / 2);

container.scrollTo({
  top: container.scrollTop + scrollOffset,
  behavior: 'smooth'
});
```

### 2. Lägg till `requestAnimationFrame` för layout-stabilitet

Vänta på att layouten är klar innan vi scrollar:

```typescript
useEffect(() => {
  if (!activeLineRef.current || !scrollContainerRef.current || !isSynced) return;
  
  // Vänta på att layout är komplett
  requestAnimationFrame(() => {
    const container = scrollContainerRef.current;
    const activeLine = activeLineRef.current;
    if (!container || !activeLine) return;
    
    // ... scroll calculation
  });
}, [currentLineIndex, isSynced]);
```

### 3. Ta bort `scroll-smooth` CSS-klass

Förlita oss enbart på `behavior: 'smooth'` i JavaScript:

```tsx
// FÖRE:
className={cn("overflow-y-auto scroll-smooth", className)}

// EFTER:
className={cn("overflow-y-auto", className)}
```

## Tekniska ändringar

### Fil: `src/components/flightdeck/SyncedLyricsDisplay.tsx`

Komplett ny scroll-logik med mobile-support:

```typescript
// Robust auto-scroll - always center active line (mobile compatible)
useEffect(() => {
  if (!activeLineRef.current || !scrollContainerRef.current || !isSynced) return;
  
  // Use requestAnimationFrame to ensure layout is complete
  requestAnimationFrame(() => {
    const container = scrollContainerRef.current;
    const activeLine = activeLineRef.current;
    if (!container || !activeLine) return;
    
    // Use getBoundingClientRect for reliable cross-browser positioning
    const containerRect = container.getBoundingClientRect();
    const lineRect = activeLine.getBoundingClientRect();
    
    // Calculate scroll offset to center the active line
    const scrollOffset = lineRect.top - containerRect.top - (containerRect.height / 2) + (lineRect.height / 2);
    
    container.scrollTo({
      top: container.scrollTop + scrollOffset,
      behavior: 'smooth'
    });
  });
}, [currentLineIndex, isSynced]);
```

Och ta bort `scroll-smooth` från className:

```tsx
return (
  <div 
    ref={scrollContainerRef}
    className={cn("overflow-y-auto", className)}
  >
    {/* ... */}
  </div>
);
```

## Sammanfattning

| Ändring | Varför |
|---------|--------|
| `getBoundingClientRect()` | Mer pålitlig än `offsetTop` på mobil |
| `requestAnimationFrame` | Väntar på layout innan scroll |
| Ta bort `scroll-smooth` | iOS Safari stöder det inte pålitligt |

## Fil att ändra

1. `src/components/flightdeck/SyncedLyricsDisplay.tsx` - Ny scroll-logik med mobile support
