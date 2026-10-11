import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGE_OPTIONS, getBrowserLanguage, translations } from '../include/locales';

const STORAGE_KEY = 'veyth-language';
const LanguageContext = createContext(null);

function resolvePath(dict, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), dict);
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved && translations[saved]) return saved;
    } catch (_) {
      // ignore
    }
    const browser = getBrowserLanguage();
    return translations[browser] ? browser : 'en';
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch (_) {
      // ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
    }
  }, [language]);

  const setLanguage = useCallback((next) => {
    if (translations[next]) setLanguageState(next);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'zh' ? 'en' : 'zh'));
  }, []);

  /** t('problems.title') → 当前语言文案，缺失时回退英文；支持 {var} 插值 */
  const t = useCallback((path, vars) => {
    let value = resolvePath(translations[language], path);
    if (typeof value !== 'string') value = resolvePath(translations.en, path);
    if (typeof value !== 'string') return path;
    if (vars) {
      value = value.replace(/\{(\w+)\}/g, (match, key) =>
        vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : match
      );
    }
    return value;
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage, t, languages: LANGUAGE_OPTIONS }),
    [language, setLanguage, toggleLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  return ctx || { language: 'en', setLanguage: () => {}, toggleLanguage: () => {}, t: (p) => p, languages: LANGUAGE_OPTIONS };
}

export default LanguageContext;