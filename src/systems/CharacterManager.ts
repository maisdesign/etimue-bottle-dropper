import { languageManager } from '../i18n/LanguageManager'

export type Character = 'charlie' | 'scrocca' | 'irlandese'

export interface CharacterInfo {
  id: Character
  name: string
  sprite: string
  description: string
}

export class CharacterManager {
  private static instance: CharacterManager
  private currentCharacter: Character = 'charlie'
  private callbacks: Set<(character: Character) => void> = new Set()

  private constructor() {
    // Load from localStorage
    const savedCharacter = localStorage.getItem('etimue-character') as Character
    if (savedCharacter && this.isValidCharacter(savedCharacter)) {
      this.currentCharacter = savedCharacter
    }

    console.log(`🐱 Character initialized: ${this.currentCharacter}`)
  }

  public static getInstance(): CharacterManager {
    if (!CharacterManager.instance) {
      CharacterManager.instance = new CharacterManager()
    }
    return CharacterManager.instance
  }

  private isValidCharacter(character: string): character is Character {
    return ['charlie', 'scrocca', 'irlandese'].includes(character)
  }

  public getCurrentCharacter(): Character {
    return this.currentCharacter
  }

  public setCharacter(character: Character): void {
    if (character !== this.currentCharacter && this.isValidCharacter(character)) {
      this.currentCharacter = character
      localStorage.setItem('etimue-character', character)

      console.log(`🐱 Character changed to: ${character}`)

      // Notify all subscribers
      this.callbacks.forEach(callback => callback(character))
    }
  }

  public getCharacterInfo(character?: Character): CharacterInfo {
    const char = character || this.currentCharacter
    const t = languageManager.getTranslation()

    switch (char) {
      case 'charlie':
        return {
          id: 'charlie',
          name: t.characterCharlie,
          sprite: 'charlie',
          description: 'Punk cat with attitude'
        }
      case 'scrocca':
        return {
          id: 'scrocca',
          name: t.characterScrocca,
          sprite: 'scrocca',
          description: 'Party cat who loves fun'
        }
      case 'irlandese':
        return {
          id: 'irlandese',
          name: t.characterIrlandese,
          sprite: 'irlandese',
          description: 'Lucky Irish cat'
        }
      default:
        return this.getCharacterInfo('charlie')
    }
  }

  public getCurrentCharacterName(): string {
    return this.getCharacterInfo().name
  }

  public getAllCharacters(): CharacterInfo[] {
    return ['charlie', 'scrocca', 'irlandese'].map(char => this.getCharacterInfo(char as Character))
  }

  public onCharacterChange(callback: (character: Character) => void): void {
    this.callbacks.add(callback)
  }

  public offCharacterChange(callback: (character: Character) => void): void {
    this.callbacks.delete(callback)
  }

  public cycleCharacter(): void {
    const characters: Character[] = ['charlie', 'scrocca', 'irlandese']
    const currentIndex = characters.indexOf(this.currentCharacter)
    const nextIndex = (currentIndex + 1) % characters.length
    this.setCharacter(characters[nextIndex])
  }
}

// Export singleton instance
export const characterManager = CharacterManager.getInstance()