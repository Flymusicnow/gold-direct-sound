
# Plan: Fixa textinmatning, borttagning och bekräftelse

## Problem att lösa

1. **Textinmatning**: Input-fältet visar inte text som går utanför - behöver text wrapping
2. **Borttagning fungerar ej**: Troligt RLS-policy problem
3. **Bekräftelsedialog**: Lägg till "Vill du ta bort?" innan radering
4. **Mobilanpassning**: Edit/delete-knappar måste synas utan hover

## Lösningar

### 1. Byt från Input till Textarea med auto-resize

Använd `Textarea` istället för `Input` för kommentarinmatning:

```text
┌─────────────────────────────────────────────────────────┐
│  Skriv en kommentar...                                  │
│  (expanderar automatiskt vid längre text)               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Samma för redigeringsläget.

### 2. Fixa RLS-policy för UPDATE

Kontrollera och uppdatera RLS-policyn så att användare kan uppdatera sina egna kommentarer (soft delete via `is_deleted`).

### 3. Bekräftelsedialog vid borttagning

Lägg till `AlertDialog` från UI-komponenter:

```text
┌─────────────────────────────────────┐
│  Ta bort kommentar?                 │
│                                     │
│  Denna åtgärd kan inte ångras.      │
│                                     │
│           [Avbryt]  [Ta bort]       │
└─────────────────────────────────────┘
```

### 4. Mobilvänliga knappar

Visa edit/delete-ikoner alltid på mobil (touch) istället för endast vid hover:

```tsx
// Desktop: opacity-0 group-hover:opacity-100
// Mobile: alltid synlig med sm:opacity-0 sm:group-hover:opacity-100
```

## Tekniska ändringar

### Fil: `src/components/spotlight/SpotlightEntryComments.tsx`

**Ändringar:**

1. Import `Textarea` istället för `Input`
2. Import `AlertDialog`-komponenter
3. Lägg till state för delete-bekräftelse: `deleteCommentId`
4. Uppdatera input-fältet till Textarea med auto-resize
5. Lägg till AlertDialog-struktur
6. Uppdatera CSS-klasser för mobilvisning av knappar

### Fil: Databas-migration

Kontrollera/fixa RLS UPDATE policy för `spotlight_entry_comments` tabellen.

## Sammanfattning

| Ändring | Beskrivning |
|---------|-------------|
| Textarea | Text wrapping + auto-expand |
| AlertDialog | Bekräfta innan radering |
| RLS fix | Tillåt UPDATE på egna kommentarer |
| Mobil CSS | Visa knappar utan hover |
