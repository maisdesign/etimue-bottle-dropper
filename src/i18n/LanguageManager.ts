import { translations, Language, Translation } from './translations'

export class LanguageManager {
  private static instance: LanguageManager
  private currentLanguage: Language = 'en'
  private callbacks: Set<(language: Language) => void> = new Set()

  private constructor() {
    // Initialize from localStorage or browser language
    const savedLanguage = localStorage.getItem('etimue-language') as Language
    const browserLanguage = navigator.language.toLowerCase()

    if (savedLanguage && savedLanguage in translations) {
      this.currentLanguage = savedLanguage
    } else if (browserLanguage.startsWith('it')) {
      this.currentLanguage = 'it'
    } else {
      this.currentLanguage = 'en'
    }

    console.log(`🌍 Language initialized: ${this.currentLanguage}`)
  }

  public static getInstance(): LanguageManager {
    if (!LanguageManager.instance) {
      LanguageManager.instance = new LanguageManager()
    }
    return LanguageManager.instance
  }

  public getCurrentLanguage(): Language {
    return this.currentLanguage
  }

  public setLanguage(language: Language): void {
    if (language !== this.currentLanguage && language in translations) {
      this.currentLanguage = language
      localStorage.setItem('etimue-language', language)

      console.log(`🌍 Language changed to: ${language}`)

      // Notify all subscribers
      this.callbacks.forEach(callback => callback(language))
    }
  }

  public getTranslation(): Translation {
    return translations[this.currentLanguage]
  }

  public translate(key: keyof Translation): string {
    return translations[this.currentLanguage][key]
  }

  public onLanguageChange(callback: (language: Language) => void): void {
    this.callbacks.add(callback)
  }

  public offLanguageChange(callback: (language: Language) => void): void {
    this.callbacks.delete(callback)
  }

  public toggleLanguage(): void {
    const newLanguage: Language = this.currentLanguage === 'en' ? 'it' : 'en'
    this.setLanguage(newLanguage)
  }

  public getAvailableLanguages(): Language[] {
    return Object.keys(translations) as Language[]
  }

  public getLanguageDisplayName(language: Language): string {
    switch (language) {
      case 'en': return 'English'
      case 'it': return 'Italiano'
      default: return language
    }
  }
}

// Export singleton instance
export const languageManager = LanguageManager.getInstance()