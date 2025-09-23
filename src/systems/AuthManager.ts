import { supabase, profileService, type Profile } from './SupabaseClient'
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

  private listeners: Array<(state: AuthState) => void> = []
  private isProcessingAuth = false

  constructor() {
    this.initializeAuth()
    this.setupAuthListeners()
  }

  private async initializeAuth(): Promise<void> {
    try {
      console.log('🔄 Initializing auth...')

      // Get current session with timeout
      const sessionPromise = supabase.auth.getSession()
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Session timeout')), 5000)
      )

      const { data: { session }, error } = await Promise.race([sessionPromise, timeoutPromise])

      if (error) {
        console.error('Error getting session:', error)
      }

      if (session) {
        console.log('✅ Session found, processing auth...')
        await this.handleAuthChange(session)
      } else {
        console.log('ℹ️ No active session')
      }

    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      this.state.isLoading = false
      this.notifyListeners()
      console.log('✅ Auth initialization complete')
    }
  }

  private setupAuthListeners(): void {
    supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event)

      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            await this.handleAuthChange(session)
          }
          break

        case 'SIGNED_OUT':
          this.resetAuthState()
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
      console.log('⏳ Already processing auth, skipping...')
      return
    }

    this.isProcessingAuth = true

    try {
      console.log('👤 Processing auth for user:', session.user.email)

      this.state.session = session
      this.state.user = session.user
      this.state.isAuthenticated = true

      // Load or create profile
      let profile = await profileService.getProfile(session.user.id)

      if (!profile) {
        console.log('📝 Creating new profile...')
        profile = await profileService.createProfile({
          username: session.user.email || session.user.user_metadata?.name || 'User',
          email: session.user.email || '',
          whatsapp: null,
          instagram: null,
          consent_marketing: false,
          consent_ts: null
        })
      }

      this.state.profile = profile
      this.state.hasMarketingConsent = profile?.consent_marketing || false

      console.log('✅ Auth processing complete:', {
        email: session.user.email,
        hasProfile: !!profile,
        hasConsent: this.state.hasMarketingConsent
      })

    } catch (error) {
      console.error('❌ Error processing auth:', error)
    } finally {
      this.state.isLoading = false
      this.isProcessingAuth = false
    }
  }

  private resetAuthState(): void {
    this.state = {
      user: null,
      profile: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,
      hasMarketingConsent: false
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

  // Public API
  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener)
    listener(this.state) // Immediate call with current state

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
    // 🔧 DEBUG BACKDOOR: Allow bypass in development
    if (import.meta.env.MODE === 'development' || window.location.hostname === 'localhost') {
      const debugAuth = localStorage.getItem('debug-auth-bypass')
      if (debugAuth === 'etimue-debug-2024') {
        console.log('🔧 DEBUG: Auth bypassed for development')
        return true
      }
    }
    return this.state.isAuthenticated
  }

  public canCompeteForPrizes(): boolean {
    return this.state.isAuthenticated && this.state.hasMarketingConsent
  }

  public async signInWithGoogle(): Promise<{ success: boolean, error?: string }> {
    try {
      // Get current origin for redirect
      const currentOrigin = window.location.origin
      let redirectTo = currentOrigin

      // For production, use the domain that's configured in Google Cloud Console
      if (currentOrigin.includes('etimuebottledropper.netlify.app')) {
        // If using new domain but Google Cloud Console still has old domain configured
        // Fall back to old domain for OAuth redirect to avoid 400 error
        redirectTo = 'https://astounding-rolypoly-fc5137.netlify.app'
        console.warn('⚠️ Using fallback domain for OAuth due to Google Cloud Console configuration')
      } else if (currentOrigin.includes('astounding-rolypoly-fc5137.netlify.app')) {
        redirectTo = 'https://astounding-rolypoly-fc5137.netlify.app'
      } else if (currentOrigin === 'http://localhost:3000') {
        redirectTo = 'http://localhost:3000'
      } else {
        redirectTo = 'https://etimuebottledropper.netlify.app'
      }

      console.log('🔐 Starting Google OAuth with redirect to:', redirectTo)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      })

      if (error) {
        console.error('Google sign in error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }

    } catch (error) {
      console.error('Google sign in exception:', error)
      return { success: false, error: 'Unexpected error during sign in' }
    }
  }

  public async signInWithOTP(email: string): Promise<{ success: boolean, error?: string }> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email
      })

      if (error) {
        console.error('OTP sign in error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }

    } catch (error) {
      console.error('OTP sign in exception:', error)
      return { success: false, error: 'Unexpected error during sign in' }
    }
  }

  public async verifyOTP(email: string, token: string): Promise<{ success: boolean, error?: string }> {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      })

      if (error) {
        console.error('OTP verification error:', error)
        return { success: false, error: error.message }
      }

      return { success: true }

    } catch (error) {
      console.error('OTP verification exception:', error)
      return { success: false, error: 'Unexpected error during verification' }
    }
  }

  public async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
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
    this.listeners = []
  }
}

// Global instance
export const authManager = new AuthManager()

// NOTE: Auth UI logic moved to GlobalFunctions.ts to avoid circular dependencies