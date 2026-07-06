import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { isSupabaseContentEnabled, isSupabaseNetworkError, supabase, supabaseAnonKey, supabaseBaseUrl } from '../lib/supabase';
import { normalizeLang, pickByLang, type SupportedLanguage } from '../lib/language';

interface Language {
  code: string;
  name: string;
  is_default: boolean;
  is_active: boolean;
}

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  languages: Language[];
  setLanguage: (code: string) => void;
  t: (key: string, defaultText?: string) => string;
  isLoading: boolean;
  translationRevision: number;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const DEFAULT_LANGUAGES: Language[] = [
  { code: 'zh-TW', name: '繁體中文', is_default: true, is_active: true },
  { code: 'en', name: 'English', is_default: false, is_active: true },
  { code: 'ja', name: '日本語', is_default: false, is_active: true },
  { code: 'ko', name: '한국어', is_default: false, is_active: true },
];

const translations: Record<string, Record<string, string>> = {};
const translationCache: Record<string, Promise<string>> = {};

const translateViaGoogle = async (sourceText: string, targetLanguage: SupportedLanguage) => {
  const params = new URLSearchParams({
    client: 'gtx',
    sl: 'auto',
    tl: targetLanguage,
    dt: 't',
    q: sourceText,
    format: 'text',
  });

  const response = await fetch(`https://translate.googleapis.com/translate_a/single?${params.toString()}`);
  if (!response.ok) return sourceText;

  const data = (await response.json()) as any;

  const translatedSegments = Array.isArray(data?.[0]) ? data[0] : [];
  const translatedText = translatedSegments
    .map((segment) => segment?.[0] || '')
    .join('')
    .trim();
  return translatedText || sourceText;
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(normalizeLang('zh-TW'));
  const [languages, setLanguages] = useState<Language[]>(DEFAULT_LANGUAGES);
  const [isLoading, setIsLoading] = useState(true);
  const [translationRevision, setTranslationRevision] = useState(0);
  const translationSourcesRef = useRef(new Map<string, string>());

  useEffect(() => {
    loadLanguages();
    const savedLanguage = localStorage.getItem('preferred_language');
    if (savedLanguage) {
      setCurrentLanguage(normalizeLang(savedLanguage));
    }
  }, []);

  const loadLanguages = async () => {
    if (!isSupabaseContentEnabled) {
      setLanguages(DEFAULT_LANGUAGES);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('languages')
        .select('code,name,is_default,is_active')
        .eq('is_active', true)
        .order('is_default', { ascending: false });

      if (error) throw error;

      const normalizedLanguages = (data?.length ? data : DEFAULT_LANGUAGES).map((lang) => ({
        ...lang,
        code: normalizeLang(lang.code),
      }));

      setLanguages(normalizedLanguages);
    } catch (error) {
      if (!isSupabaseNetworkError(error)) {
        console.warn('Using default languages:', error);
      }
      setLanguages(DEFAULT_LANGUAGES);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = (code: string) => {
    const normalized = normalizeLang(code);
    setCurrentLanguage(normalized);
    localStorage.setItem('preferred_language', normalized);
  };

  const fetchTranslation = async (key: string, sourceText: string, targetLanguage: SupportedLanguage): Promise<string> => {
    try {
      const apiUrl = `${supabaseBaseUrl}/functions/v1/translate`;
      const headers = {
        Authorization: `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          key,
          targetLanguage,
          sourceText,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!translations[targetLanguage]) {
          translations[targetLanguage] = {};
        }
        let nextTranslation = String(data.translation || sourceText).trim();
        if (!nextTranslation || nextTranslation === sourceText) {
          nextTranslation = await translateViaGoogle(sourceText, targetLanguage);
        }
        translations[targetLanguage][key] = nextTranslation;
        setTranslationRevision((value) => value + 1);
        return nextTranslation;
      }
    } catch (error) {
      if (!isSupabaseNetworkError(error)) {
        console.warn('Translation failed:', error);
      }
    }

    return translateViaGoogle(sourceText, targetLanguage);
  };

  const requestTranslation = (key: string, sourceText: string, targetLanguage: SupportedLanguage) => {
    const cacheKey = `${targetLanguage}:${key}`;

    if (!translationCache[cacheKey]) {
      translationCache[cacheKey] = fetchTranslation(key, sourceText, targetLanguage);
    }

    return translationCache[cacheKey];
  };

  const t = (key: string, defaultText?: string): string => {
    const lang = normalizeLang(currentLanguage);
    const shouldTranslate = pickByLang(lang, false, true, true, true);
    const sourceText = defaultText || key;

    translationSourcesRef.current.set(key, sourceText);

    if (!isSupabaseContentEnabled || !shouldTranslate) {
      return sourceText;
    }

    if (translations[lang]?.[key]) {
      return translations[lang][key];
    }
    requestTranslation(key, sourceText, lang);
    return sourceText;
  };

  useEffect(() => {
    const lang = normalizeLang(currentLanguage);
    const shouldTranslate = pickByLang(lang, false, true, true, true);
    if (!isSupabaseContentEnabled || !shouldTranslate) return;

    translationSourcesRef.current.forEach((sourceText, key) => {
      if (!translations[lang]?.[key]) {
        requestTranslation(key, sourceText, lang);
      }
    });
  }, [currentLanguage]);

  return (
    <LanguageContext.Provider value={{ currentLanguage, languages, setLanguage, t, isLoading, translationRevision }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
