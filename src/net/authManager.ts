import { supabase, profileService, type Profile } from './supabaseClient'
import { AuthModal } from '@/ui/AuthModal'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  hasMarketingConsent: boolean
}

export class AuthManager {
  private state: AuthState = {
    user: null,
    profile: null, 
    session: null,
    isLoading: true,
    isAuthenticated: false,
    hasMarketingConsent: false
  }

  private authModal: AuthModal | null = null
  private listeners: Array<(state: AuthState) => void> = []

  constructor() {
    this.initializeAuth()
    this.setupAuthListeners()
  }

  private async initializeAuth(): Promise<void> {
    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
      }

      if (session) {
        await this.handleAuthChange(session)
      }

      this.state.isLoading = false
      this.notifyListeners()

    } catch (error) {
      console.error('Auth initialization error:', error)
      this.state.isLoading = false
      this.notifyListeners()
    }
  }

  private setupAuthListeners(): void {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            await this.handleAuthChange(session)
          }
          break
          
        case 'SIGNED_OUT':
          this.state = {
            user: null,
            profile: null,
            session: null,
            isLoading: false,
            isAuthenticated: false,
            hasMarketingConsent: false
          }
          break
          
        case 'TOKEN_REFRESHED':
          if (session) {
            this.state.session = session
            this.state.user = session.user
          }
          break
      }

      this.notifyListeners()
    })
  }

  private async handleAuthChange(session: Session): Promise<void> {
    try {
      this.state.session = session
      this.state.user = session.user
      this.state.isAuthenticated = true

      // Load or create user profile
      let profile = await profileService.getProfile(session.user.id)
      
      if (!profile) {
        // Create profile if it doesn't exist
        profile = await profileService.createProfile({
          id: session.user.id,
          username: session.user.user_metadata?.name || 
                   session.user.user_metadata?.full_name || 
                   null,
          whatsapp: null,
          instagram: null,
          consent_marketing: false,
          consent_ts: null
        })
      }

      this.state.profile = profile
      this.state.hasMarketingConsent = profile?.consent_marketing || false

    } catch (error) {
      console.error('Error handling auth change:', error)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.state)
      } catch (error) {
        console.error('Error in auth listener:', error)
      }
    })
  }

  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener)
    
    // Immediately call with current state
    listener(this.state)
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  public getState(): AuthState {
    return { ...this.state }
  }

  public isReady(): boolean {
    return !this.state.isLoading
  }

  public canPlayGame(): boolean {
    return this.state.isAuthenticated && this.state.hasMarketingConsent
  }

  public async showAuthModal(): Promise<User | null> {
    return new Promise((resolve) => {
      if (!this.authModal) {
        this.authModal = new AuthModal()
      }

      this.authModal.onAuth((user) => {
        resolve(user)
      })

      this.authModal.show()
    })
  }

  public async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Close auth modal if open
      if (this.authModal) {
        this.authModal.hide()
      }
      
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  public async updateProfile(updates: Partial<Profile>): Promise<Profile | null> {
    if (!this.state.user) {
      throw new Error('No authenticated user')
    }

    try {
      const profile = await profileService.updateProfile(this.state.user.id, updates)
      
      if (profile) {
        this.state.profile = profile
        
        // Update marketing consent flag if changed
        if ('consent_marketing' in updates) {
          this.state.hasMarketingConsent = profile.consent_marketing
        }
        
        this.notifyListeners()
      }
      
      return profile
      
    } catch (error) {
      console.error('Profile update error:', error)
      throw error
    }
  }

  public async refreshProfile(): Promise<void> {
    if (!this.state.user) return

    try {
      const profile = await profileService.getProfile(this.state.user.id)
      if (profile) {
        this.state.profile = profile
        this.state.hasMarketingConsent = profile.consent_marketing
        this.notifyListeners()
      }
    } catch (error) {
      console.error('Profile refresh error:', error)
    }
  }

  public destroy(): void {
    if (this.authModal) {
      this.authModal.destroy()
      this.authModal = null
    }
    
    this.listeners = []
  }
}

// Global instance
export const authManager = new AuthManager()

// Helper to ensure user is authenticated before playing
export const requireAuth = async (): Promise<boolean> => {
  if (authManager.canPlayGame()) {
    return true
  }

  if (!authManager.isReady()) {
    // Wait for auth to initialize
    await new Promise(resolve => {
      const unsubscribe = authManager.subscribe((state) => {
        if (!state.isLoading) {
          unsubscribe()
          resolve(void 0)
        }
      })
    })
  }

  if (authManager.canPlayGame()) {
    return true
  }

  // Show auth modal
  const user = await authManager.showAuthModal()
  return !!user && authManager.canPlayGame()
}