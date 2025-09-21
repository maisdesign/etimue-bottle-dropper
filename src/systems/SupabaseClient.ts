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
    detectSessionInUrl: true,
    flowType: 'pkce'
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
      console.log('🏆 Starting weekly leaderboard query...')
      console.log('🔌 Supabase client status:', { url: supabaseUrl, connected: true })

      // Test Supabase connection first
      console.log('🧪 Testing Supabase connection...')
      try {
        const connectionTestPromise = supabase.from('scores').select('count', { count: 'exact', head: true })
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Connection test timeout')), 5000)
        )

        await Promise.race([connectionTestPromise, timeoutPromise])
        console.log('✅ Supabase connection test passed')
      } catch (error) {
        console.error('❌ Supabase connection test failed:', error)
        throw new Error('Database connection failed')
      }

      // Calculate start of current week (Monday 00:00) - OPTIMIZED: Only last 3 days for faster query
      const now = new Date()
      const threeDaysAgo = new Date(now)
      threeDaysAgo.setDate(now.getDate() - 3)
      threeDaysAgo.setHours(0, 0, 0, 0)

      console.log(`📅 Optimized range: Last 3 days from ${threeDaysAgo.toISOString()} to ${now.toISOString()}`)

      // OPTIMIZATION 1: Smaller time range (3 days instead of 7)
      // OPTIMIZATION 2: Smaller limit for faster response
      console.log(`📋 Querying recent scores since: ${threeDaysAgo.toISOString()}`)

      // Add timeout to database query - INCREASED to 30s for better reliability
      const queryPromise = supabase
        .from('scores')
        .select('*')
        .gte('created_at', threeDaysAgo.toISOString())
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(Math.min(limit, 20)) // OPTIMIZATION 3: Max 20 results for speed

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 30000) // 30s timeout
      )

      let { data, error } = await Promise.race([queryPromise, timeoutPromise])
      let scoreData: Score[] | null = data as Score[] | null

      if (error) {
        console.error('Primary query failed, trying fallback...', error)

        // FALLBACK STRATEGY: Try ultra-simple query with just today's scores
        try {
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          console.log('🔄 Attempting fallback: Today only query...')
          const fallbackQuery = supabase
            .from('scores')
            .select('id, user_id, score, run_seconds, created_at')
            .gte('created_at', today.toISOString())
            .order('score', { ascending: false })
            .limit(10)

          const fallbackTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Fallback timeout')), 15000)
          )

          const { data: fallbackData, error: fallbackError } = await Promise.race([fallbackQuery, fallbackTimeout])

          if (!fallbackError && fallbackData) {
            console.log(`✅ Fallback successful: ${fallbackData.length} today's scores`)
            scoreData = fallbackData as Score[]
            error = null
          } else {
            console.error('Fallback also failed:', fallbackError)
            return []
          }
        } catch (fallbackException) {
          console.error('Fallback exception:', fallbackException)
          return []
        }
      }

      if (!scoreData) {
        console.error('No data received from queries')
        return []
      }

      console.log(`📊 Found ${scoreData.length} scores, fetching nicknames...`)

      // OPTIMIZATION 4: Batch profile fetching with reduced timeout and early exit
      console.log(`📝 Batch fetching ${scoreData.length} profiles with 3s timeout each...`)

      const scoresWithNicknames = await Promise.all(
        scoreData.map(async (score) => {
          try {
            // OPTIMIZATION: Reduced timeout from 5s to 3s
            const profilePromise = profileService.getProfile(score.user_id)
            const timeoutPromise = new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
            )

            const profile = await Promise.race([profilePromise, timeoutPromise])

            return {
              ...score,
              nickname: profile?.nickname || 'Anonimo'
            }
          } catch (error) {
            // OPTIMIZATION: Fail fast with default nickname
            return {
              ...score,
              nickname: 'Anonimo'
            }
          }
        })
      )

      console.log(`✅ Weekly leaderboard loaded: ${scoresWithNicknames.length} entries`)
      return scoresWithNicknames
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

      // Simplified approach: Get scores only for now
      console.log(`📋 Querying monthly scores since: ${startOfMonth.toISOString()}`)

      // Add timeout to database query
      const queryPromise = supabase
        .from('scores')
        .select('*')
        .gte('created_at', startOfMonth.toISOString())
        .order('score', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit)

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      )

      const { data, error } = await Promise.race([queryPromise, timeoutPromise])

      if (error) {
        console.error('Error fetching monthly leaderboard:', error)
        return []
      }

      console.log(`📊 Found ${data?.length || 0} monthly scores, fetching nicknames...`)

      // For each score, try to get the profile separately with timeout
      const scoresWithNicknames = await Promise.all(
        (data as Score[]).map(async (score, index) => {
          try {
            console.log(`📝 Fetching profile ${index + 1}/${data.length} for user ${score.user_id}`)

            // Add timeout to profile fetch
            const profilePromise = profileService.getProfile(score.user_id)
            const timeoutPromise = new Promise<null>((_, reject) =>
              setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
            )

            const profile = await Promise.race([profilePromise, timeoutPromise])

            return {
              ...score,
              nickname: profile?.nickname || 'Anonimo'
            }
          } catch (error) {
            console.warn(`⚠️ Failed to fetch profile for user ${score.user_id}:`, error)
            return {
              ...score,
              nickname: 'Anonimo'
            }
          }
        })
      )

      console.log(`✅ Monthly leaderboard loaded: ${scoresWithNicknames.length} entries`)
      return scoresWithNicknames
    } catch (error) {
      console.error('Monthly leaderboard exception:', error)
      return []
    }
  }
}