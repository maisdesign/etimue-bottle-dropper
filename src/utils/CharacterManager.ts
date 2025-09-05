export interface Character {
  id: string
  name: string
  textureKey: string
  description: string
  imagePath: string
}

export class CharacterManager {
  private static instance: CharacterManager
  
  // Available characters
  private characters: Character[] = [
    {
      id: 'charlie',
      name: 'Charlie',
      textureKey: 'charlie',
      description: 'The punk cat - edgy and cool!',
      imagePath: './characters/charlie.png'
    },
    {
      id: 'scrocca',
      name: 'Scrocca', 
      textureKey: 'scrocca',
      description: 'The party cat - loves to celebrate!',
      imagePath: './characters/scrocca.png'
    },
    {
      id: 'irlandese',
      name: 'Irlandese',
      textureKey: 'irlandese', 
      description: 'The lucky Irish cat - brings fortune!',
      imagePath: './characters/irlandese.png'
    }
  ]

  private selectedCharacterId: string = 'charlie' // Default character

  private constructor() {
    // Load saved character preference
    this.loadSelectedCharacter()
  }

  public static getInstance(): CharacterManager {
    if (!CharacterManager.instance) {
      CharacterManager.instance = new CharacterManager()
    }
    return CharacterManager.instance
  }

  public getCharacters(): Character[] {
    return [...this.characters]
  }

  public getSelectedCharacter(): Character {
    const character = this.characters.find(c => c.id === this.selectedCharacterId)
    return character || this.characters[0] // Fallback to first character
  }

  public selectCharacter(characterId: string): boolean {
    const character = this.characters.find(c => c.id === characterId)
    if (character) {
      this.selectedCharacterId = characterId
      this.saveSelectedCharacter()
      return true
    }
    return false
  }

  public getSelectedCharacterTextureKey(): string {
    return this.getSelectedCharacter().textureKey
  }

  private loadSelectedCharacter(): void {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('selectedCharacter')
      if (saved && this.characters.some(c => c.id === saved)) {
        this.selectedCharacterId = saved
      }
    }
  }

  private saveSelectedCharacter(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('selectedCharacter', this.selectedCharacterId)
    }
  }
}

// Export singleton instance
export const characterManager = CharacterManager.getInstance()