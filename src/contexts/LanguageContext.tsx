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
    } else {
      // DEFAULT TO ENGLISH - not browser language detection
      setLanguageState('en');
      localStorage.setItem('preferred_language', 'en');
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

    // FAIL-CLOSED: never expose internal dotted keys
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }

    // Key is missing — log in dev, return humanized last segment
    if (import.meta.env.DEV) {
      console.warn(`[i18n] Missing key: "${key}" (lang: ${language})`);
    }

    const lastSegment = keys[keys.length - 1];
    return lastSegment
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  
  // DEV-only fallback for hot-reload timing issues
  if (!context) {
    if (import.meta.env.DEV) {
      console.warn('[DEV] useLanguage called outside LanguageProvider - using fallback');
      return {
        language: 'en' as Language,
        setLanguage: async () => {},
        t: (key: string) => {
          const segments = key.split('.');
          const last = segments[segments.length - 1];
          return last.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase()).trim();
        },
      };
    }
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  
  return context;
};
