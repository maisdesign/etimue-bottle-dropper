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
  private isProcessingAuth = false
  private lastProcessedUserId: string | null = null
  private lastProcessTime: number = 0

  constructor() {
    this.initializeAuth()
    this.setupAuthListeners()
  }

  private async initializeAuth(): Promise<void> {
    try {
      console.log('🚀 Starting auth initialization...')
      
      // Get current session with timeout
      const sessionPromise = supabase.auth.getSession()
      const sessionTimeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Session loading timeout')), 8000)
      )
      
      const { data: { session }, error } = await Promise.race([sessionPromise, sessionTimeoutPromise])
      
      if (error) {
        console.error('❌ Error getting session:', error)
      }

      if (session) {
        console.log('👤 Session found, handling auth change...')
        await this.handleAuthChange(session)
      } else {
        console.log('👤 No active session found')
      }

      this.state.isLoading = false
      console.log('✅ Auth initialization complete!')
      this.notifyListeners()

    } catch (error) {
      console.error('❌ Auth initialization error:', error)
      this.state.isLoading = false
      this.notifyListeners()
    }
  }

  private setupAuthListeners(): void {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      console.log('🚨 NUOVO LOG DI TEST - SE VEDI QUESTO IL CODICE È AGGIORNATO')
      
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
    if (this.isProcessingAuth) {
      console.log('⏭️ Skipping auth change - already processing')
      return
    }
    
    // Anti-loop: Skip if same user processed recently (within 30 seconds)
    const now = Date.now()
    if (this.lastProcessedUserId === session.user.id && (now - this.lastProcessTime) < 30000) {
      console.log(`⏭️ Skipping auth change - user ${session.user.email} processed recently`)
      return
    }
    
    this.isProcessingAuth = true
    
    try {
      console.log('🔄 Starting handleAuthChange for user:', session.user.email)
      
      this.state.session = session
      this.state.user = session.user
      this.state.isAuthenticated = true

      // Load or create user profile with timeout
      console.log('📥 Loading user profile...')
      
      const profilePromise = profileService.getProfile(session.user.id)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile loading timeout')), 20000)
      )
      
      let profile
      try {
        profile = await Promise.race([profilePromise, timeoutPromise])
        console.log('📊 Existing profile loaded:', profile)
      } catch (error) {
        console.error('❌ Profile loading failed:', error)
        console.log('⚠️ Continuing without profile...')
        profile = null
      }
      
      if (!profile) {
        console.log('👤 Creating new profile...')
        try {
          const createPromise = profileService.createProfile({
            id: session.user.id,
            username: session.user.user_metadata?.name || 
                     session.user.user_metadata?.full_name || 
                     null,
            whatsapp: null,
            instagram: null,
            consent_marketing: false,
            consent_ts: null
          })
          
          const createTimeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile creation timeout')), 20000)
          )
          
          profile = await Promise.race([createPromise, createTimeoutPromise])
          console.log('✅ New profile created:', profile)
        } catch (error) {
          console.error('❌ Profile creation failed:', error)
          console.log('⚠️ Continuing with default profile state...')
        }
      }

      this.state.profile = profile
      this.state.hasMarketingConsent = profile?.consent_marketing || false
      this.state.isLoading = false // 🔥 CRITICAL: Always set loading to false!
      
      console.log('📋 Final auth state:', {
        email: session.user.email,
        hasProfile: !!profile,
        hasMarketingConsent: this.state.hasMarketingConsent,
        isLoading: this.state.isLoading
      })

    } catch (error) {
      console.error('❌ Error in handleAuthChange:', error)
      // Always set loading to false even on error
      this.state.isLoading = false
    } finally {
      // Update anti-loop trackers
      this.lastProcessedUserId = session.user.id
      this.lastProcessTime = Date.now()
      this.isProcessingAuth = false
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

  public updateMarketingConsent(hasConsent: boolean, profile?: Profile): void {
    console.log('🔄 Updating marketing consent:', hasConsent)
    this.state.hasMarketingConsent = hasConsent
    if (profile) {
      this.state.profile = profile
    }
    this.notifyListeners()
  }

  public isReady(): boolean {
    return !this.state.isLoading
  }

  public canPlayGame(): boolean {
    const result = this.state.isAuthenticated && this.state.hasMarketingConsent
    console.log(`🎯 canPlayGame() check: authenticated=${this.state.isAuthenticated}, consent=${this.state.hasMarketingConsent} → ${result}`)
    return result
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
  console.log('🎮 requireAuth called')
  console.log('📊 Current auth state:', authManager.getState())
  console.log('🎯 canPlayGame():', authManager.canPlayGame())

  if (authManager.canPlayGame()) {
    console.log('✅ User can already play!')
    return true
  }

  if (!authManager.isReady()) {
    console.log('⏳ Auth not ready, waiting...')
    // Wait for auth to initialize
    await new Promise(resolve => {
      const unsubscribe = authManager.subscribe((state) => {
        console.log('🔄 Auth state change in requireAuth:', state)
        if (!state.isLoading) {
          unsubscribe()
          resolve(void 0)
        }
      })
    })
  }

  console.log('🔍 After wait - canPlayGame():', authManager.canPlayGame())
  if (authManager.canPlayGame()) {
    console.log('✅ User can play after wait!')
    return true
  }

  // Show auth modal
  console.log('🔐 Showing auth modal...')
  const user = await authManager.showAuthModal()
  
  // Wait a moment for state to update after modal interaction
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Refresh profile to get latest consent status
  await authManager.refreshProfile()
  
  const finalCanPlay = authManager.canPlayGame()
  console.log('🏁 Final canPlayGame() result:', finalCanPlay)
  console.log('🏁 Final auth state:', authManager.getState())
  
  return !!user && finalCanPlay
}