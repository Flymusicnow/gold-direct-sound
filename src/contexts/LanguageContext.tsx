import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from '@/i18n/en';
import { sv } from '@/i18n/sv';
import { supabase } from '@/integrations/supabase/client';

type Language = 'en' | 'sv';
type Translations = typeof en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations: Record<Language, Translations> = {
  en,
  sv,
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [userId, setUserId] = useState<string | null>(null);

  // Listen for auth state changes independently
  useEffect(() => {
    // Load from localStorage first for immediate display
    const storedLang = localStorage.getItem('preferred_language') as Language | null;
    if (storedLang && (storedLang === 'en' || storedLang === 'sv')) {
      setLanguageState(storedLang);
    }

    // Set up auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUserId = session?.user?.id ?? null;
      setUserId(currentUserId);

      // If user just logged in, sync language preference from database
      if (currentUserId && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        // Use setTimeout to avoid Supabase deadlock
        setTimeout(async () => {
          const { data } = await supabase
            .from('profiles')
            .select('preferred_language')
            .eq('id', currentUserId)
            .single();

          if (data?.preferred_language && (data.preferred_language === 'en' || data.preferred_language === 'sv')) {
            setLanguageState(data.preferred_language as Language);
            localStorage.setItem('preferred_language', data.preferred_language);
          }
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferred_language', lang);

    // If user is logged in, persist to database
    if (userId) {
      await supabase
        .from('profiles')
        .update({ preferred_language: lang })
        .eq('id', userId);
    }
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
