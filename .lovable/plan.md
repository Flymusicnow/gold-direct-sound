
# Plan: "Gå till sidan"-knapp för resolved issues

## Problem
När en issue är markerad som **resolved**, försvinner "Test Fix on Affected Page"-knappen. Administratörer vill snabbt kunna navigera till den påverkade sidan för att verifiera att fixen fungerar.

## Nuvarande beteende
```text
┌──────────────────────────────────┐
│ Actions                          │
├──────────────────────────────────┤
│ [🧠 Generate fix plan]           │ ← Alltid synlig
│ [✓ Test Fix on Affected Page]   │ ← DOLD när resolved
│ [Assignment dropdown]            │ ← DOLD när resolved
│ [Status selector]                │ ← DOLD när resolved
│ [Quick Resolve]                  │ ← DOLD när resolved
│                                  │
│   ✓ Resolved                     │ ← Visas när resolved
│   by Admin Name                  │
│   2026-01-30 12:00               │
└──────────────────────────────────┘
```

## Önskat beteende
```text
┌──────────────────────────────────┐
│ Actions                          │
├──────────────────────────────────┤
│   ✓ Resolved                     │
│   by Admin Name                  │
│   2026-01-30 12:00               │
│                                  │
│ [🔍 Gå till sidan & testa]      │ ← NY KNAPP (prominent)
│                                  │
│ Rutt: /fan/missions              │ ← Visar vilken rutt
└──────────────────────────────────┘
```

## Lösning

### Fil: `src/pages/admin/AdminInboxDetail.tsx`

**Ändring 1:** Lägg till en "Test Fix"-knapp som visas när issuen är resolved/verified

Efter resolved status display (rad ~635), lägg till:

```tsx
{/* Test Fix button - visible for resolved issues */}
{isClosed && message.type === 'contextual_report' && verifyUrl && (
  <div className="pt-3 space-y-2">
    <Button
      className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
      onClick={handleOpenVerify}
    >
      <ExternalLink className="h-4 w-4 mr-2" />
      🔍 Gå till sidan & testa
    </Button>
    
    {/* Show the affected route */}
    {aiContext?.route && (
      <p className="text-xs text-center text-muted-foreground">
        Rutt: <code className="bg-muted px-1 rounded">{aiContext.route}</code>
      </p>
    )}
  </div>
)}
```

**Ändring 2:** Gör "Developer Tools"-kortet mer synligt för resolved issues genom att flytta det högre upp (optional)

## Resultat

- ✅ Prominent knapp för att gå direkt till påverkad sida efter resolve
- ✅ Visar tydligt vilken rutt som påverkades
- ✅ Öppnar sidan i ny flik med verify-mode (`?__verify=1`)
- ✅ Fungerar för både resolved och verified status

## Teknisk sammanfattning

```text
AdminInboxDetail.tsx
    │
    └── Actions Card
        ├── isResolved/isVerified status display (befintlig)
        │
        └── NY: "Gå till sidan & testa" knapp
            ├── Villkor: isClosed && contextual_report && verifyUrl
            ├── Visar rutten under knappen
            └── Öppnar i ny flik med __verify=1
```
