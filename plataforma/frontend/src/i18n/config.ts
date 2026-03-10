import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

// Import translations
import esTranslations from './locales/es.json';
import enTranslations from './locales/en.json';
import frTranslations from './locales/fr.json';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Fallback language
    fallbackLng: 'es',

    // Default namespace
    defaultNS: 'translation',

    // Debug mode (disable in production)
    debug: false,

    // Interpolation settings
    interpolation: {
      escapeValue: false // React already escapes values
    },

    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    },

    // Resources
    resources: {
      es: {
        translation: esTranslations
      },
      en: {
        translation: enTranslations
      },
      fr: {
        translation: frTranslations
      }
    },

    // React options
    react: {
      useSuspense: false
    }
  });

export default i18n;

// Export available languages
export const languages = [
  { code: 'es', name: 'Español', flag: '🇪🇸', nativeName: 'Español' },
  { code: 'en', name: 'English', flag: '🇺🇸', nativeName: 'English' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', nativeName: 'Français' }
];