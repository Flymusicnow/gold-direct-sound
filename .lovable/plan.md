

# Plan: Visa Inloggad Användare i Dropdown-menyn

## Problem
När man klickar på användarikonen i navigationen visas bara:
- Settings
- Report Issue
- Sign Out

Man kan inte se **vem** som är inloggad, vilket gör det svårt att veta vilken konto som används.

## Nuvarande UI
```text
┌─────────────────┐
│ ⚙️ Settings     │
│ 🐛 Report Issue │
│ → Sign Out      │
└─────────────────┘
```

## Ny UI
```text
┌─────────────────────┐
│ 👤 Topliner         │  ← Namn
│ lajomusiq@gmail.com │  ← Email
│ 🎤 Artist           │  ← Roll
├─────────────────────┤
│ ⚙️ Settings         │
│ 🐛 Report Issue     │
├─────────────────────┤
│ → Sign Out          │
└─────────────────────┘
```

## Ändringar

### Fil: `src/components/Navigation.tsx`

**Ändring 1:** Uppdatera imports (rad 13-18)
```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,      // NY
  DropdownMenuSeparator,  // NY
} from "@/components/ui/dropdown-menu";
```

**Ändring 2:** Desktop dropdown - Lägg till användarinfo (rad 161, efter `<DropdownMenuContent align="end">`)
```tsx
<DropdownMenuContent align="end">
  {/* User Identity Section */}
  <DropdownMenuLabel className="font-normal">
    <div className="flex flex-col space-y-1">
      <p className="text-sm font-medium leading-none">
        {profile?.full_name || 'User'}
      </p>
      <p className="text-xs leading-none text-muted-foreground">
        {user?.email}
      </p>
      {hasRole('artist') && (
        <p className="text-xs text-primary">Artist</p>
      )}
      {hasRole('fan') && !hasRole('artist') && (
        <p className="text-xs text-primary">Fan</p>
      )}
      {hasRole('brand') && (
        <p className="text-xs text-primary">Brand</p>
      )}
      {hasRole('admin') && (
        <p className="text-xs text-amber-500">Admin</p>
      )}
    </div>
  </DropdownMenuLabel>
  <DropdownMenuSeparator />
  
  {/* Settings option - existing code */}
  ...
```

**Ändring 3:** Lägg till separator före Sign Out
```tsx
<DropdownMenuSeparator />
<DropdownMenuItem onClick={() => signOut()}>
  <LogOut className="mr-2 h-4 w-4" />
  {t('nav.signOut')}
</DropdownMenuItem>
```

**Ändring 4:** Samma ändringar för mobil dropdown (rad ~340-375)
Identisk struktur med användarinfo + separators i mobilmenyn.

## Resultat

- Visar användarens namn tydligt
- Visar email för identifikation
- Visar aktuell roll (Artist/Fan/Brand/Admin)
- Tydlig separation mellan sektioner
- Fungerar på både desktop och mobil

## Teknisk sammanfattning

```text
Navigation.tsx
    │
    ├── Desktop Dropdown (rad ~155-193)
    │   ├── NY: DropdownMenuLabel med namn/email/roll
    │   ├── NY: DropdownMenuSeparator
    │   ├── Settings
    │   ├── Report Issue
    │   ├── NY: DropdownMenuSeparator
    │   └── Sign Out
    │
    └── Mobile Dropdown (rad ~340-375)
        └── Samma struktur
```

