import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('🔍 Debug Supabase env vars:', {
  url: supabaseUrl ? '✅ present' : '❌ missing',
  key: supabaseAnonKey ? '✅ present' : '❌ missing',
  urlValue: supabaseUrl,
  keyFirst10: supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + '...' : 'undefined'
})

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Database types
export interface Profile {
  id: string
  username: string | null
  whatsapp: string | null
  instagram: string | null
  consent_marketing: boolean
  consent_ts: string | null
  created_at: string
  updated_at: string
}

export interface Score {
  id: number
  user_id: string
  score: number
  run_seconds: number
  created_at: string
  tz: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
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

// Auth helpers
export const auth = supabase.auth

// Check if user is admin
export const isAdmin = (userId: string): boolean => {
  const adminUuids = import.meta.env.VITE_ADMIN_UUIDS?.split(',') || []
  return adminUuids.includes(userId)
}

// Profile operations
export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle() // Use maybeSingle instead of single to handle missing records

      if (error) {
        console.error('Error fetching profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Profile fetch exception:', error)
      return null
    }
  },

  async createProfile(profile: Database['public']['Tables']['profiles']['Insert']): Promise<Profile | null> {
    // Use upsert to handle existing profiles
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating/updating profile:', error)
      return null
    }

    return data
  },

  async updateProfile(userId: string, updates: Database['public']['Tables']['profiles']['Update']): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return null
    }

    return data
  },

  async checkNicknameAvailability(nickname: string, excludeUserId?: string): Promise<boolean> {
    try {
      if (!nickname || nickname.trim().length === 0) {
        return true // Empty nicknames are allowed (will show as Anonymous)
      }

      const query = supabase
        .from('profiles')
        .select('id')
        .eq('username', nickname.trim())

      // Exclude current user when checking (for profile updates)
      if (excludeUserId) {
        query.neq('id', excludeUserId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error checking nickname availability:', error)
        return false // Assume not available on error
      }

      // Nickname is available if no other user has it
      return data.length === 0

    } catch (error) {
      console.error('Nickname availability check exception:', error)
      return false
    }
  }
}

// Score operations
export const scoreService = {
  async submitScore(userId: string, score: number, runSeconds: number = 60, gameEndTimestamp?: number): Promise<Score | null> {
    try {
      // Get current session for authorization
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError || !session) {
        console.error('❌ No valid session for score submission')
        return null
      }

      // Prepare submission data
      const submissionData = {
        score,
        runSeconds,
        gameEndTimestamp: gameEndTimestamp || Date.now()
      }

      // Call Supabase Edge Function for server-side validation
      const { data, error } = await supabase.functions.invoke('submit-score', {
        body: submissionData,
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      })

      if (error) {
        console.error('❌ Edge Function error:', error)
        return null
      }

      if (!data.success) {
        console.error('❌ Score submission failed:', data.error, data.details)
        return null
      }

      console.log('✅ Score submitted successfully:', data.storedScore)
      
      // Return the stored score in the expected format
      return {
        id: data.storedScore.id,
        user_id: userId,
        score: data.storedScore.score,
        run_seconds: data.storedScore.runSeconds,
        created_at: new Date().toISOString(),
        tz: 'Europe/Rome'
      }

    } catch (error) {
      console.error('❌ Score submission error:', error)
      return null
    }
  },

  // Legacy direct database method for emergencies (with client validation)
  async _submitScoreDirect(userId: string, score: number, runSeconds: number = 60): Promise<Score | null> {
    console.warn('⚠️ Using legacy direct database submission')
    
    // Client-side validation (less secure)
    if (score < 0 || score > 600) {
      console.error('❌ Invalid score range:', score)
      return null
    }

    if (runSeconds < 5) {
      console.error('❌ Game too short, likely invalid:', runSeconds)
      return null
    }
    
    const insertData = {
      user_id: userId,
      score,
      run_seconds: runSeconds, // Now supports variable duration
      tz: 'Europe/Rome'
    }
    
    const insertPromise = supabase
      .from('scores')
      .insert(insertData)
      .select()
      .single()
    
    console.log('⏳ Waiting for database response...')
    const { data, error } = await insertPromise
    console.log('📨 Database response received')

    if (error) {
      console.error('❌ Database error submitting score:', error)
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      return null
    }

    console.log('✅ Score submitted successfully:', data)

    return data
  },

  async getWeeklyLeaderboard(limit: number = 50): Promise<Array<Score & { username: string }>> {
    // Calculate start of current week (Monday 00:00 Europe/Rome)
    const now = new Date()
    const dayOfWeek = now.getDay() || 7 // Make Sunday = 7
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1)
    startOfWeek.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('scores')
      .select(`
        *,
        profiles (username)
      `)
      .gte('created_at', startOfWeek.toISOString())
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching weekly leaderboard:', error)
      return []
    }

    return data.map(item => ({
      ...item,
      username: item.profiles?.username || 'Anonymous'
    }))
  },

  async getMonthlyLeaderboard(limit: number = 50): Promise<Array<Score & { username: string }>> {
    // Calculate start of current month (1st day 00:00 Europe/Rome)
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const { data, error } = await supabase
      .from('scores')
      .select(`
        *,
        profiles (username)
      `)
      .gte('created_at', startOfMonth.toISOString())
      .order('score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching monthly leaderboard:', error)
      return []
    }

    return data.map(item => ({
      ...item,
      username: item.profiles?.username || 'Anonymous'
    }))
  },

  async getUserBestScore(userId: string, period: 'weekly' | 'monthly' = 'weekly'): Promise<number> {
    const now = new Date()
    let startDate: Date

    if (period === 'weekly') {
      const dayOfWeek = now.getDay() || 7
      startDate = new Date(now)
      startDate.setDate(now.getDate() - dayOfWeek + 1)
      startDate.setHours(0, 0, 0, 0)
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const { data, error } = await supabase
      .from('scores')
      .select('score')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('score', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      return 0
    }

    return data[0].score
  }
}