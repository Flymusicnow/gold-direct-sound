import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { en } from '@/i18n/en';
import { sv } from '@/i18n/sv';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user, profile } = useAuth();

  // Load language from profile or localStorage on mount
  useEffect(() => {
    const loadLanguage = async () => {
      // First check localStorage for immediate display
      const storedLang = localStorage.getItem('preferred_language') as Language | null;
      if (storedLang && (storedLang === 'en' || storedLang === 'sv')) {
        setLanguageState(storedLang);
      }

      // If user is logged in, sync from database
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('preferred_language')
          .eq('id', user.id)
          .single();

        if (data?.preferred_language && (data.preferred_language === 'en' || data.preferred_language === 'sv')) {
          setLanguageState(data.preferred_language as Language);
          localStorage.setItem('preferred_language', data.preferred_language);
        }
      }
    };

    loadLanguage();
  }, [user]);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('preferred_language', lang);

    // If user is logged in, persist to database
    if (user) {
      await supabase
        .from('profiles')
        .update({ preferred_language: lang })
        .eq('id', user.id);
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
