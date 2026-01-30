
# Plan: Fixa 404 för "issue_fixed" notifikationer

## Problem

Trigger-funktionen `notify_reporter_on_issue_resolved()` skickar **alla** användare till `/studio/dashboard` oavsett deras roll. Fans har inte tillgång till denna route.

## Lösning

Uppdatera trigger-funktionen att använda **den ursprungliga routen** där användaren rapporterade problemet, eller en roll-baserad dashboard som fallback.

## Databasändring

Ersätt den hårdkodade länken med dynamisk routing:

```sql
CREATE OR REPLACE FUNCTION public.notify_reporter_on_issue_resolved()
RETURNS TRIGGER AS $$
DECLARE
  reporter_user_id UUID;
  reporter_role TEXT;
  original_route TEXT;
  notification_link TEXT;
BEGIN
  IF (NEW.status IN ('resolved', 'verified') AND 
      (OLD.status IS NULL OR OLD.status NOT IN ('resolved', 'verified'))) THEN
    
    reporter_user_id := (NEW.payload->'ai_context'->>'user_id')::UUID;
    reporter_role := NEW.payload->'ai_context'->>'user_role';
    original_route := NEW.payload->'ai_context'->>'route';
    
    -- Bestäm länk baserat på roll och original route
    notification_link := CASE
      WHEN original_route IS NOT NULL AND original_route != '' THEN original_route
      WHEN reporter_role = 'fan' THEN '/fan/dashboard'
      WHEN reporter_role = 'artist' THEN '/studio/dashboard'
      WHEN reporter_role = 'brand' THEN '/brand/dashboard'
      ELSE '/role-selection'
    END;
    
    IF reporter_user_id IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message, link, metadata, severity)
      VALUES (
        reporter_user_id,
        'issue_fixed',
        '✅ Your reported issue has been fixed!',
        COALESCE(NEW.resolution_summary, 'The issue you reported has been resolved.'),
        notification_link,  -- Dynamisk länk istället för hårdkodad
        jsonb_build_object(
          'inbox_id', NEW.id,
          'resolved_at', NEW.resolved_at,
          'original_route', original_route
        ),
        'important'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

## Logik

| Scenario | Länk |
|----------|------|
| Original route finns | `/fan/feed` (den ursprungliga routen) |
| Fan utan route | `/fan/dashboard` |
| Artist utan route | `/studio/dashboard` |
| Brand utan route | `/brand/dashboard` |
| Okänd roll | `/role-selection` |

## Tekniska detaljer

- **Fil:** Ny SQL-migration
- **Funktion:** `notify_reporter_on_issue_resolved()`
- **Trigger:** Ingen ändring behövs (redan kopplad)
- **Befintliga notifikationer:** Kan uppdateras manuellt vid behov

## Bonus: Uppdatera befintliga notifikationer

För att fixa redan skapade notifikationer med fel länk:

```sql
UPDATE notifications n
SET link = COALESCE(
  (SELECT im.payload->'ai_context'->>'route' 
   FROM inbox_messages im 
   WHERE im.id = (n.metadata->>'inbox_id')::uuid),
  CASE 
    WHEN EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = n.user_id AND ur.role = 'fan') 
    THEN '/fan/dashboard'
    ELSE '/studio/dashboard'
  END
)
WHERE n.type = 'issue_fixed';
```
