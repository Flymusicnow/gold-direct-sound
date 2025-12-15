import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { InboxLanguage, getInboxTranslation, InboxTranslationKey } from "@/i18n/inbox";

export function useInboxLanguage() {
  const { user } = useAuth();
  const [language, setLanguageState] = useState<InboxLanguage>("en");
  const [loading, setLoading] = useState(true);

  // Fetch user's inbox language preference
  useEffect(() => {
    async function fetchLanguage() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("admin_inbox_language")
          .eq("id", user.id)
          .single();

        if (!error && data?.admin_inbox_language) {
          setLanguageState(data.admin_inbox_language as InboxLanguage);
        }
      } catch (e) {
        console.error("Failed to fetch inbox language:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchLanguage();
  }, [user]);

  // Update language preference
  const setLanguage = useCallback(
    async (newLang: InboxLanguage) => {
      if (!user) return;

      setLanguageState(newLang);

      try {
        await supabase
          .from("profiles")
          .update({ admin_inbox_language: newLang })
          .eq("id", user.id);
      } catch (e) {
        console.error("Failed to save inbox language:", e);
      }
    },
    [user]
  );

  // Translation helper
  const t = useCallback(
    (key: InboxTranslationKey): string => {
      return getInboxTranslation(language, key);
    },
    [language]
  );

  return {
    language,
    setLanguage,
    t,
    loading,
  };
}
