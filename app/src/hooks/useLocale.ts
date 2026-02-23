'use client';

import { useState, useEffect, useCallback } from 'react';
import { Locale, t, getTranslations, isRTL, getDirection, LOCALES } from '@/lib/i18n';

const STORAGE_KEY = 'potomac_locale';

interface UseLocaleReturn {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  translations: Record<string, string>;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
  locales: typeof LOCALES;
}

export function useLocale(): UseLocaleReturn {
  const [locale, setLocaleState] = useState<Locale>('en');

  // Set locale
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newLocale);
    }

    // Update document attributes
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
      document.documentElement.dir = getDirection(newLocale);
    }
  }, []);

  // Initialize locale on mount
  useEffect(() => {
    // Get saved locale or detect from browser
    const savedLocale = typeof window !== 'undefined' 
      ? localStorage.getItem(STORAGE_KEY) as Locale 
      : null;
    
    let initialLocale: Locale = 'en';
    
    if (savedLocale && LOCALES.some(l => l.code === savedLocale)) {
      initialLocale = savedLocale;
    } else if (typeof navigator !== 'undefined') {
      // Detect from browser language
      const browserLang = navigator.language.split('-')[0];
      const matchedLocale = LOCALES.find(l => l.code === browserLang);
      if (matchedLocale) {
        initialLocale = matchedLocale.code;
      }
    }

    setLocaleState(initialLocale);
    
    // Update document attributes
    if (typeof document !== 'undefined') {
      document.documentElement.lang = initialLocale;
      document.documentElement.dir = getDirection(initialLocale);
    }
  }, []);

  // Translation function bound to current locale
  const translate = useCallback((key: string) => t(key, locale), [locale]);

  return {
    locale,
    setLocale,
    t: translate,
    translations: getTranslations(locale),
    isRTL: isRTL(locale),
    direction: getDirection(locale),
    locales: LOCALES,
  };
}

export default useLocale;