import { createClient } from '@supabase/supabase-js'

// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return null
    }

    return data
  },

  async createProfile(profile: Database['public']['Tables']['profiles']['Insert']): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
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
  }
}

// Score operations
export const scoreService = {
  async submitScore(userId: string, score: number, runSeconds: number = 60): Promise<Score | null> {
    // Anti-cheat validation
    if (score < 0 || score > 600) {
      console.error('Invalid score range')
      return null
    }

    if (runSeconds !== 60) {
      console.error('Invalid run duration')
      return null
    }

    const { data, error } = await supabase
      .from('scores')
      .insert({
        user_id: userId,
        score,
        run_seconds: runSeconds,
        tz: 'Europe/Rome'
      })
      .select()
      .single()

    if (error) {
      console.error('Error submitting score:', error)
      return null
    }

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