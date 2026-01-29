
# Notifikationssystem för Admin-uppdateringar (Wave 1)

## Nulägesanalys

Projektet har redan:
- **`notifications`-tabell** med `user_id`, `type`, `title`, `message`, `link`, `read`, `metadata`
- **`NotificationBell`-komponent** som redan visas i StudioSidebar för artister
- **`inbox_messages`-tabell** för admin-issues med status (unread/in_progress/resolved/verified)
- **`platform_updates`-tabell** med `target_roles` för roll-baserade uppdateringar
- **Realtime-prenumeration** för notifikationer

## Vad som saknas

1. **Automatisk notifikation vid issue-resolution** - ingen trigger finns när admin markerar issue som "resolved"
2. **Severity-fält** på notifikationer (`info` / `important`)
3. **Admin-endpoint för att skapa notifikationer till specifika användare/roller**
4. **Nya notifikationstyper** (`admin_update`, `issue_fixed`, `release_note`)

---

## Teknisk Implementation

### Del 1: Databasändringar

Lägg till severity-kolumn och nya typer i befintlig `notifications`-tabell:

```sql
-- Lägg till severity-kolumn
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'info' 
CHECK (severity IN ('info', 'important'));

-- Lägg till index för rollfrågor
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
```

### Del 2: Database Trigger för Issue Resolution

Skapa trigger som automatiskt skapar notifikationer när en issue löses:

```sql
CREATE OR REPLACE FUNCTION notify_reporter_on_issue_resolved()
RETURNS TRIGGER AS $$
DECLARE
  reporter_user_id UUID;
  issue_title TEXT;
BEGIN
  -- Endast trigga vid statusändring till 'resolved' eller 'verified'
  IF (NEW.status IN ('resolved', 'verified') AND 
      (OLD.status IS NULL OR OLD.status NOT IN ('resolved', 'verified'))) THEN
    
    -- Hämta reporter_id från payload (om contextual_report)
    reporter_user_id := (NEW.payload->'ai_context'->>'user_id')::UUID;
    
    IF reporter_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, link, metadata, severity)
      VALUES (
        reporter_user_id,
        'issue_fixed',
        '✅ Your reported issue has been fixed!',
        COALESCE(NEW.resolution_summary, 'The issue you reported has been resolved.'),
        '/studio/dashboard',
        jsonb_build_object(
          'inbox_id', NEW.id,
          'resolved_at', NEW.resolved_at
        ),
        'important'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger på inbox_messages
CREATE TRIGGER on_inbox_resolved_notify_reporter
  AFTER UPDATE OF status ON inbox_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_reporter_on_issue_resolved();
```

### Del 3: RPC-funktion för Admin-notifikationer

Skapa säker funktion för att låta admin skicka notifikationer:

```sql
CREATE OR REPLACE FUNCTION send_admin_notification(
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_target_user_ids UUID[] DEFAULT NULL,
  p_target_role TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL,
  p_severity TEXT DEFAULT 'info'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
  inserted_count INTEGER := 0;
BEGIN
  -- Verifiera att anroparen är admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can send notifications';
  END IF;
  
  -- Om specifika user_ids anges
  IF p_target_user_ids IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, severity)
    SELECT unnest(p_target_user_ids), p_type, p_title, p_message, p_link, p_severity;
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
  -- Om target_role anges (t.ex. 'artist')
  ELSIF p_target_role IS NOT NULL THEN
    FOR user_record IN 
      SELECT DISTINCT user_id FROM user_roles WHERE role::text = p_target_role
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link, severity)
      VALUES (user_record.user_id, p_type, p_title, p_message, p_link, p_severity);
      inserted_count := inserted_count + 1;
    END LOOP;
  END IF;
  
  RETURN inserted_count;
END;
$$;
```

### Del 4: Frontend-uppdateringar

#### 4a. Uppdatera NotificationItem.tsx

Lägg till ikoner och styling för nya typer:

```typescript
// Nya cases i getIcon()
case 'admin_update':
  return <Megaphone className="h-4 w-4 text-blue-500" />;
case 'issue_fixed':
  return <CheckCircle2 className="h-4 w-4 text-green-500" />;
case 'release_note':
  return <Rocket className="h-4 w-4 text-purple-500" />;
```

#### 4b. Skapa Admin Notification Dialog

Ny komponent för att skicka notifikationer från admin:

**Fil:** `src/components/admin/SendNotificationDialog.tsx`

```typescript
interface SendNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Formulärfält:
// - Type (admin_update / release_note)
// - Title
// - Message
// - Target (All Artists / Specific users)
// - Severity (info / important)
// - Link (optional)
```

#### 4c. Lägg till i AdminUpdates.tsx

En knapp "Send Notification" som öppnar dialogen.

---

## Filstruktur

| Fil | Ändring |
|-----|---------|
| `supabase/migrations/XXXX_admin_notifications.sql` | Databasändringar + trigger + RPC |
| `src/components/notifications/NotificationItem.tsx` | Nya ikoner för admin-typer |
| `src/components/admin/SendNotificationDialog.tsx` | **NY** - Dialog för admin |
| `src/pages/admin/AdminUpdates.tsx` | Lägg till "Send Notification" knapp |

---

## Flödesdiagram

```text
Admin markerar issue som "resolved"
           │
           ▼
   ┌───────────────────┐
   │ inbox_messages    │
   │ status = resolved │
   └─────────┬─────────┘
             │
             ▼
   ┌───────────────────────────────┐
   │ TRIGGER: notify_reporter...  │
   │ Hämtar reporter_user_id      │
   │ från payload->ai_context     │
   └─────────┬─────────────────────┘
             │
             ▼
   ┌───────────────────────────────┐
   │ INSERT INTO notifications    │
   │ type = 'issue_fixed'         │
   │ user_id = reporter           │
   └─────────┬─────────────────────┘
             │
             ▼
   ┌───────────────────────────────┐
   │ NotificationBell (realtime)  │
   │ Artist ser ny notifikation   │
   └───────────────────────────────┘
```

---

## Säkerhetsmodell

- **RLS på notifications**: Användare kan endast läsa/uppdatera egna notifikationer
- **SECURITY DEFINER på trigger**: Triggen kan infoga notifikationer för alla användare
- **is_admin() check**: RPC-funktionen validerar admin-status innan bulk-insert
- **Identity separation**: Admin kan inte läsa artisters notifikationer via NotificationBell

---

## Definition of Done

- [ ] Admin-trigger skapar automatiskt notifikation när issue markeras resolved
- [ ] RPC-funktion `send_admin_notification` fungerar för batch-utskick
- [ ] NotificationItem visar rätt ikon/styling för admin_update, issue_fixed, release_note
- [ ] SendNotificationDialog tillåter admin att skicka till alla artister eller specifika users
- [ ] Mobile-first UI med subtila övergångar
- [ ] Ingen påverkan på ekonomi eller ranking-system
