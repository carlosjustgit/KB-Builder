import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Initialize i18next
i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en-US',
    supportedLngs: ['en-US', 'en-GB', 'pt-BR', 'pt-PT'],
    
    // Namespace configuration
    ns: ['common', 'step-welcome', 'step-brand', 'step-services', 'step-market', 'step-competitors', 'step-visual', 'step-export', 'discovery-bar'],
    defaultNS: 'common',
    
    // Lazy loading configuration
    backend: {
      loadPath: '/i18n/{{lng}}/kb-builder/{{ns}}.json',
    },
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    
    react: {
      useSuspense: false,
    },
  });

export default i18n;

/**
 * Type-safe translation helper
 * Usage: const { t } = useTranslation('step-welcome');
 */
export type Locale = 'en-US' | 'en-GB' | 'pt-BR' | 'pt-PT';

export function changeLanguage(lng: Locale) {
  return i18n.changeLanguage(lng);
}

export function getCurrentLanguage(): Locale {
  return i18n.language as Locale;
}

