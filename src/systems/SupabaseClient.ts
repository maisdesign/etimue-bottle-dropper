import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Environment check:', {
  url: supabaseUrl ? 'SET' : 'MISSING',
  key: supabaseAnonKey ? 'SET' : 'MISSING',
  env: import.meta.env
})

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing env vars:', { supabaseUrl, supabaseAnonKey })
  throw new Error(`Missing Supabase environment variables: URL=${!!supabaseUrl}, KEY=${!!supabaseAnonKey}`)
}

// Database types
export interface Profile {
  id: string
  email: string
  nickname: string | null
  consent_marketing: boolean
  consent_timestamp: string | null
  created_at: string
}

export interface Score {
  id: number
  user_id: string
  score: number
  run_seconds: number
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      scores: {
        Row: Score
        Insert: Omit<Score, 'id' | 'created_at'>
        Update: Partial<Omit<Score, 'id' | 'created_at'>>
      }
    }
  }
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Check if user is admin
export const isAdmin = (userId: string): boolean => {
  const adminUuids = import.meta.env.VITE_ADMIN_UUIDS?.split(',') || []
  return adminUuids.includes(userId)
}

// Profile service
export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data as Profile | null
    } catch (error) {
      console.error('Profile fetch exception:', error)
      return null
    }
  },

  async createProfile(profile: Database['public']['Tables']['profiles']['Insert']): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profile as any, {
          onConflict: 'id',
          ignoreDuplicates: false
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating profile:', error)
        return null
      }

      return data as Profile
    } catch (error) {
      console.error('Profile creation exception:', error)
      return null
    }
  },

  async updateProfile(userId: string, updates: Partial<Omit<Profile, 'id' | 'created_at'>>): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        // @ts-ignore - Temporary fix for type inference issue
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        console.error('Error updating profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Profile update exception:', error)
      return null
    }
  },

  async checkNicknameAvailability(nickname: string, excludeUserId?: string): Promise<boolean> {
    try {
      if (!nickname || nickname.trim().length === 0) {
        return true // Empty nicknames are allowed
      }

      const query = supabase
        .from('profiles')
        .select('id')
        .eq('nickname' as any, nickname.trim())

      if (excludeUserId) {
        query.neq('id', excludeUserId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error checking nickname availability:', error)
        return false
      }

      return data.length === 0
    } catch (error) {
      console.error('Nickname availability check exception:', error)
      return false
    }
  }
}

// Score service
export const scoreService = {
  async submitScore(userId: string, score: number, runSeconds: number): Promise<Score | null> {
    try {
      // Get current session for authorization
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()

      if (sessionError || !session) {
        console.error('No valid session for score submission')
        return null
      }

      // Try Edge Function first (server-side validation)
      try {
        const { data, error } = await supabase.functions.invoke('submit-score', {
          body: {
            score,
            runSeconds,
            gameEndTimestamp: Date.now()
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        })

        if (error) throw error

        if (data.success) {
          console.log('Score submitted via Edge Function:', data.storedScore)
          return {
            id: data.storedScore.id,
            user_id: userId,
            score: data.storedScore.score,
            run_seconds: data.storedScore.runSeconds,
            created_at: new Date().toISOString()
          }
        }
      } catch (edgeError) {
        console.warn('Edge Function failed, using fallback:', edgeError)
      }

      // Fallback to direct database submission with client-side validation
      if (score < 0 || score > 600) {
        console.error('Invalid score range:', score)
        return null
      }

      if (runSeconds < 5) {
        console.error('Game too short, likely invalid:', runSeconds)
        return null
      }

      const { data, error } = await supabase
        .from('scores')
        .insert({
          user_id: userId,
          score,
          run_seconds: runSeconds
        } as any)
        .select()
        .single()

      if (error) {
        console.error('Database error submitting score:', error)
        return null
      }

      console.log('Score submitted via direct database:', data)
      return data as Score

    } catch (error) {
      console.error('Score submission error:', error)
      return null
    }
  },

  async getWeeklyLeaderboard(limit: number = 50): Promise<Array<Score & { nickname: string }>> {
    try {
      // Calculate start of current week (Monday 00:00)
      const now = new Date()
      const dayOfWeek = now.getDay() || 7 // Make Sunday = 7
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - dayOfWeek + 1)
      startOfWeek.setHours(0, 0, 0, 0)

      const { data, error } = await supabase
        .from('scores')
        .select(`
          *,
          profiles (nickname)
        `)
        .gte('created_at', startOfWeek.toISOString())
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Error fetching weekly leaderboard:', error)
        return []
      }

      return (data as any[]).map(item => ({
        ...item,
        nickname: item.profiles?.nickname || 'Anonymous'
      }))
    } catch (error) {
      console.error('Weekly leaderboard exception:', error)
      return []
    }
  },

  async getMonthlyLeaderboard(limit: number = 50): Promise<Array<Score & { nickname: string }>> {
    try {
      // Calculate start of current month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      const { data, error } = await supabase
        .from('scores')
        .select(`
          *,
          profiles (nickname)
        `)
        .gte('created_at', startOfMonth.toISOString())
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit)

      if (error) {
        console.error('Error fetching monthly leaderboard:', error)
        return []
      }

      return (data as any[]).map(item => ({
        ...item,
        nickname: item.profiles?.nickname || 'Anonymous'
      }))
    } catch (error) {
      console.error('Monthly leaderboard exception:', error)
      return []
    }
  }
}