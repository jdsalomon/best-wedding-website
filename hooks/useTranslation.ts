import { useLanguageContext } from '../contexts/LanguageContext'
import enTranslations from '../translations/en.json'
import frTranslations from '../translations/fr.json'

const translations = {
  en: enTranslations,
  fr: frTranslations
}

export const useTranslation = () => {
  const { language } = useLanguageContext()

  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
      if (value === undefined) {
        console.warn(`Translation key "${key}" not found for language "${language}"`)
        return key
      }
    }
    
    return value
  }

  return { t, language }
}