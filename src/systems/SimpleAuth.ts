// =====================================================
// SIMPLE AUTH SYSTEM - Clean rewrite
// =====================================================

import { createClient, type User } from '@supabase/supabase-js'

// Simple, clean interfaces
export interface UserProfile {
  id: string
  display_name: string
  email: string
  whatsapp: string | null
  instagram: string | null
  consent_marketing: boolean
  consent_ts: string | null
  created_at: string
  updated_at: string
}

export interface GameScore {
  id: number
  user_id: string
  score: number
  game_duration: number
  created_at: string
}

export interface AuthState {
  user: User | null
  profile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean
}

class SimpleAuthSystem {
  private supabase
  private state: AuthState = {
    user: null,
    profile: null,
    isAuthenticated: false,
    isLoading: true
  }
  private listeners: Array<(state: AuthState) => void> = []

  constructor() {
    // Initialize Supabase with clean config
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xtpfssiraytzvdvgrsol.supabase.co'
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cGZzc2lyYXl0enZkdmdyc29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNjM1NzcsImV4cCI6MjA3MTgzOTU3N30.sr3C3c9vEC2yuM4k503_EcXjKp7kfX5TZx9uBM53UOw'

    console.log('🔧 SimpleAuth: Initializing...')
    console.log(`📡 URL: ${supabaseUrl}`)
    console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...`)

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })

    this.initialize()
  }

  private async initialize() {
    try {
      console.log('🔄 SimpleAuth: Getting initial session...')

      const { data: { session }, error } = await this.supabase.auth.getSession()

      if (error) {
        console.error('❌ SimpleAuth: Session error:', error)
        this.state.isLoading = false
        this.notifyListeners()
        return
      }

      if (session?.user) {
        console.log('✅ SimpleAuth: User found, loading profile...')
        await this.handleSignIn(session.user)
      } else {
        console.log('ℹ️ SimpleAuth: No session found')
        this.state.isLoading = false
        this.notifyListeners()
      }

      // Listen for auth changes
      this.supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔄 SimpleAuth: Auth state change:', event)

        if (event === 'SIGNED_IN' && session?.user) {
          await this.handleSignIn(session.user)
        } else if (event === 'SIGNED_OUT') {
          this.handleSignOut()
        }
      })

    } catch (error) {
      console.error('💥 SimpleAuth: Initialize error:', error)
      this.state.isLoading = false
      this.notifyListeners()
    }
  }

  private async handleSignIn(user: User) {
    try {
      console.log(`👤 SimpleAuth: Handling sign in for ${user.email}`)

      this.state.user = user
      this.state.isAuthenticated = true

      // Get or create profile
      let profile = await this.getProfile(user.id)

      if (!profile) {
        console.log('📝 SimpleAuth: Creating new profile...')
        profile = await this.createProfile(user)
      }

      this.state.profile = profile
      this.state.isLoading = false

      console.log('✅ SimpleAuth: Sign in complete')
      this.notifyListeners()

    } catch (error) {
      console.error('❌ SimpleAuth: Sign in error:', error)
      this.state.isLoading = false
      this.notifyListeners()
    }
  }

  private handleSignOut() {
    console.log('👋 SimpleAuth: Handling sign out')

    this.state = {
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false
    }

    this.notifyListeners()
  }

  private async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log(`📋 SimpleAuth: Getting profile for ${userId}`)

      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.log('ℹ️ SimpleAuth: Profile not found:', error.message)
        return null
      }

      console.log('✅ SimpleAuth: Profile found')
      return data as UserProfile

    } catch (error) {
      console.error('❌ SimpleAuth: Get profile error:', error)
      return null
    }
  }

  private async createProfile(user: User): Promise<UserProfile | null> {
    try {
      const profileData = {
        id: user.id,
        display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Player',
        email: user.email || '',
        whatsapp: null,
        instagram: null,
        consent_marketing: false,
        consent_ts: null
      }

      console.log('📝 SimpleAuth: Creating profile:', profileData)

      const { data, error } = await this.supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single()

      if (error) {
        console.error('❌ SimpleAuth: Create profile error:', error)
        return null
      }

      console.log('✅ SimpleAuth: Profile created')
      return data as UserProfile

    } catch (error) {
      console.error('❌ SimpleAuth: Create profile error:', error)
      return null
    }
  }

  // Public API
  public subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener)
    listener(this.state) // Immediate call

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

  public async signInWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🔐 SimpleAuth: Starting Google sign in...')

      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })

      if (error) {
        console.error('❌ SimpleAuth: Google sign in error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ SimpleAuth: Google sign in initiated')
      return { success: true }

    } catch (error) {
      console.error('💥 SimpleAuth: Google sign in exception:', error)
      return { success: false, error: 'Unexpected error' }
    }
  }

  public async signOut(): Promise<void> {
    try {
      console.log('👋 SimpleAuth: Signing out...')
      await this.supabase.auth.signOut()
      console.log('✅ SimpleAuth: Signed out')
    } catch (error) {
      console.error('❌ SimpleAuth: Sign out error:', error)
    }
  }

  public async submitScore(score: number, gameDuration: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.state.isAuthenticated || !this.state.user) {
        return { success: false, error: 'Not authenticated' }
      }

      console.log(`📊 SimpleAuth: Submitting score ${score} (${gameDuration}s)`)

      const { error } = await this.supabase
        .from('scores')
        .insert({
          user_id: this.state.user.id,
          score: score,
          game_duration: gameDuration
        })
        .select()
        .single()

      if (error) {
        console.error('❌ SimpleAuth: Submit score error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ SimpleAuth: Score submitted successfully')
      return { success: true }

    } catch (error) {
      console.error('💥 SimpleAuth: Submit score exception:', error)
      return { success: false, error: 'Unexpected error' }
    }
  }

  public async getLeaderboard(limit: number = 10): Promise<Array<GameScore & { display_name: string }>> {
    try {
      console.log(`🏆 SimpleAuth: Getting leaderboard (limit: ${limit})`)

      // Get recent scores (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Prima prova query semplice solo scores
      const { data: scoresData, error: scoresError } = await this.supabase
        .from('scores')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit)

      if (scoresError) {
        console.error('❌ SimpleAuth: Scores query error:', scoresError)
        return []
      }

      // Poi prendi i profili separatamente
      const userIds = scoresData.map(score => score.user_id)
      const { data: profilesData, error: profilesError } = await this.supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds)

      if (profilesError) {
        console.error('❌ SimpleAuth: Profiles query error:', profilesError)
        // Fallback: usa "Player" come display_name
        return scoresData.map(item => ({
          ...item,
          display_name: 'Player'
        }))
      }

      console.log(`✅ SimpleAuth: Leaderboard loaded (${scoresData.length} scores, ${profilesData.length} profiles)`)

      // Combina scores con profiles
      return scoresData.map(score => {
        const profile = profilesData.find(p => p.id === score.user_id)
        return {
          ...score,
          display_name: profile?.display_name || 'Player'
        }
      })

    } catch (error) {
      console.error('💥 SimpleAuth: Leaderboard exception:', error)
      return []
    }
  }

  public async subscribeToNewsletter(): Promise<{ success: boolean; error?: string; alreadySubscribed?: boolean; isPermanentlyDeleted?: boolean }> {
    try {
      if (!this.state.isAuthenticated || !this.state.user) {
        return { success: false, error: 'Not authenticated' }
      }

      console.log(`📧 SimpleAuth: Subscribing ${this.state.user.email} to newsletter`)

      const { data: { session }, error: sessionError } = await this.supabase.auth.getSession()

      if (sessionError || !session) {
        return { success: false, error: 'No valid session' }
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xtpfssiraytzvdvgrsol.supabase.co'
      const response = await fetch(`${supabaseUrl}/functions/v1/mailchimp-subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: this.state.user.email,
          userId: this.state.user.id,
          displayName: this.state.profile?.display_name
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('❌ SimpleAuth: Newsletter subscription failed:', result)
        return { success: false, error: result.error || 'Subscription failed' }
      }

      if (result.alreadySubscribed) {
        console.log('ℹ️ SimpleAuth: User already subscribed to newsletter')
        return { success: true, alreadySubscribed: true }
      }

      // Update local state to reflect marketing consent
      if (this.state.profile) {
        this.state.profile.consent_marketing = true
        this.state.profile.consent_ts = new Date().toISOString()
      }

      console.log('✅ SimpleAuth: Newsletter subscription successful')
      return { success: true }

    } catch (error) {
      console.error('💥 SimpleAuth: Newsletter subscription exception:', error)
      return { success: false, error: 'Unexpected error' }
    }
  }

  public async getPrizeLeaderboard(limit: number = 10, period: 'weekly' | 'monthly' = 'weekly'): Promise<Array<GameScore & { display_name: string; eligible_for_prize: boolean }>> {
    try {
      console.log(`🏆 SimpleAuth: Getting PRIZE leaderboard (${period}, limit: ${limit}) - Newsletter subscribers only`)

      // Calculate date range based on period
      const dateThreshold = new Date()
      if (period === 'weekly') {
        dateThreshold.setDate(dateThreshold.getDate() - 7)
      } else {
        dateThreshold.setDate(dateThreshold.getDate() - 30)
      }

      // Get scores from the period
      const { data: scoresData, error: scoresError } = await this.supabase
        .from('scores')
        .select('*')
        .gte('created_at', dateThreshold.toISOString())
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit * 3) // Get more to filter by newsletter subscription

      if (scoresError) {
        console.error('❌ SimpleAuth: Scores query error:', scoresError)
        return []
      }

      // Get profiles - ONLY those with marketing consent
      const userIds = scoresData.map(score => score.user_id)
      const { data: profilesData, error: profilesError } = await this.supabase
        .from('profiles')
        .select('id, display_name, consent_marketing')
        .in('id', userIds)
        .eq('consent_marketing', true) // ONLY newsletter subscribers

      if (profilesError) {
        console.error('❌ SimpleAuth: Profiles query error:', profilesError)
        return []
      }

      console.log(`✅ SimpleAuth: Prize leaderboard - ${scoresData.length} scores, ${profilesData.length} eligible users (newsletter subscribers)`)

      // Filter scores to only include newsletter subscribers and combine with profiles
      const eligibleScores = scoresData
        .filter(score => profilesData.some(profile => profile.id === score.user_id))
        .slice(0, limit) // Apply final limit after filtering
        .map(score => {
          const profile = profilesData.find(p => p.id === score.user_id)
          return {
            ...score,
            display_name: profile?.display_name || 'Player',
            eligible_for_prize: true
          }
        })

      console.log(`🏆 Final prize leaderboard: ${eligibleScores.length} eligible entries`)
      return eligibleScores

    } catch (error) {
      console.error('💥 SimpleAuth: Prize leaderboard exception:', error)
      return []
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener(this.state)
      } catch (error) {
        console.error('❌ SimpleAuth: Listener error:', error)
      }
    })
  }
}

// Export singleton instance
export const simpleAuth = new SimpleAuthSystem()
export default simpleAuth