import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ru from './locales/ru.json';
import en from './locales/en.json';

export const RESOURCES = {
    ru: { translation: ru },
    en: { translation: en },
} as const;

export type Language = keyof typeof RESOURCES;
export type TranslationKey = string;

i18n.use(initReactI18next).init({
    resources: RESOURCES,
    lng: 'ru',
    fallbackLng: 'ru',
    interpolation: {
        escapeValue: false,
    },
    react: {
        useSuspense: false,
    },
});

export default i18n;
