import itTranslations from './it.json'
import enTranslations from './en.json'

type TranslationKey = string
type Translations = typeof itTranslations

const translations: Record<string, Translations> = {
  it: itTranslations,
  en: enTranslations
}

export class I18n {
  private currentLanguage: string = 'it'

  constructor() {
    // Detect browser language
    const browserLang = navigator.language.split('-')[0]
    this.currentLanguage = translations[browserLang] ? browserLang : 'it'
    
    // Load saved language from localStorage
    const savedLang = localStorage.getItem('game-language')
    if (savedLang && translations[savedLang]) {
      this.currentLanguage = savedLang
    }
  }

  setLanguage(lang: string): void {
    if (translations[lang]) {
      this.currentLanguage = lang
      localStorage.setItem('game-language', lang)
      
      // Dispatch custom event for UI updates
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: lang } 
      }))
    }
  }

  getCurrentLanguage(): string {
    return this.currentLanguage
  }

  t(key: TranslationKey, params?: Record<string, string | number>): string {
    const keys = key.split('.')
    let value: any = translations[this.currentLanguage]

    for (const k of keys) {
      value = value?.[k]
    }

    if (typeof value !== 'string') {
      console.warn(`Translation key not found: ${key}`)
      return key
    }

    // Replace parameters in the format {{param}}
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match: string, param: string) => {
        return params[param]?.toString() || match
      })
    }

    return value
  }

  getAvailableLanguages(): Array<{code: string, name: string}> {
    return [
      { code: 'it', name: 'Italiano' },
      { code: 'en', name: 'English' }
    ]
  }
}

// Global instance
export const i18n = new I18n()

// Global helper function
export const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
  return i18n.t(key, params)
}