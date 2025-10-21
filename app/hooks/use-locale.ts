'use client';

import * as React from 'react';

const STORAGE_KEY = 'chronos_locale';
type Locale = 'zh' | 'en';

type SetStateAction<T> = T | ((prev: T) => T);

export function useLocale(): [Locale, (value: SetStateAction<Locale>) => void] {
  const [locale, setLocale] = React.useState<Locale>('zh');

  React.useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'zh') {
      setLocale(stored);
    }
  }, []);

  const setLocaleAndStore = React.useCallback((value: SetStateAction<Locale>) => {
    setLocale((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
      return next;
    });
  }, []);

  return [locale, setLocaleAndStore];
}
