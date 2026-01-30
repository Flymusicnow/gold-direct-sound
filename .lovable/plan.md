

# Plan: Ta bort teckenräknare + Lägg till kopieringsknapp för Issue Details

## Sammanfattning

| Uppgift | Fil | Komplexitet |
|---------|-----|-------------|
| 1. Ta bort teckenräknare | `src/components/community/CommentComposer.tsx` | Enkel |
| 2. Lägg till Copy-knapp för Details | `src/pages/admin/AdminInboxDetail.tsx` | Enkel |

---

## Uppgift 1: Ta bort teckenräknaren i CommentComposer

**Fil:** `src/components/community/CommentComposer.tsx`

**Nuvarande kod (rad 93-96):**
```typescript
<div className="flex items-center gap-2">
  <EmojiPicker onEmojiSelect={(emoji) => setContent(prev => prev + emoji)} />
  <span className="text-xs text-muted-foreground">{content.length}/1000</span>
</div>
```

**Ny kod:**
```typescript
<EmojiPicker onEmojiSelect={(emoji) => setContent(prev => prev + emoji)} />
```

Resultat: Emoji-väljaren finns kvar, men teckenräknaren (15/1000) tas bort.

---

## Uppgift 2: Lägg till kopieringsknapp för Issue Details

**Fil:** `src/pages/admin/AdminInboxDetail.tsx`

**Nuvarande kod (rad 409-417):**
```tsx
{/* Payload details */}
{message.payload && (
  <div className="bg-muted rounded-lg p-4 space-y-2">
    <h4 className="font-medium text-sm">{t("details")}</h4>
    <pre className="text-xs overflow-auto max-h-48">
      {JSON.stringify(message.payload, null, 2)}
    </pre>
  </div>
)}
```

**Ny kod:**
```tsx
{/* Payload details */}
{message.payload && (
  <div className="bg-muted rounded-lg p-4 space-y-2">
    <div className="flex items-center justify-between">
      <h4 className="font-medium text-sm">{t("details")}</h4>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(JSON.stringify(message.payload, null, 2));
            toast({ title: "Details copied!", description: "Issue details copied to clipboard" });
          } catch (err) {
            console.log('Details:', JSON.stringify(message.payload, null, 2));
            toast({ title: "Logged to console", description: "Clipboard access failed" });
          }
        }}
      >
        <Copy className="h-3.5 w-3.5" />
        Copy
      </Button>
    </div>
    <pre className="text-xs overflow-auto max-h-48">
      {JSON.stringify(message.payload, null, 2)}
    </pre>
  </div>
)}
```

`Copy`-ikonen är redan importerad (rad 33), så ingen ny import behövs.

---

## Resultat

- EmojiPicker finns kvar utan teckenräknare
- Copy-knapp visas bredvid "Details"-rubriken i admin inbox
- Klick kopierar hela JSON-payload till clipboard
- Toast-feedback bekräftar kopieringen

