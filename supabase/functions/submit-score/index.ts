import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

interface ScoreSubmission {
  score: number
  runSeconds: number
  gameEndTimestamp: number
}

interface ScoreResponse {
  success: boolean
  storedScore?: {
    id: number
    score: number
    runSeconds: number
    position?: number
  }
  error?: string
  details?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user from authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Parse request body
    const body: ScoreSubmission = await req.json()
    const { score, runSeconds, gameEndTimestamp } = body

    // Server-side validations
    const now = Date.now()
    const timeDifference = Math.abs(now - gameEndTimestamp)
    
    // Validation 1: Timestamp should be within 10 seconds of server time
    if (timeDifference > 10000) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid game end timestamp',
          details: `Time difference: ${timeDifference}ms (max: 10000ms)`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validation 2: Score range
    if (score < 0 || score > 600) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid score range',
          details: `Score: ${score} (allowed: 0-600)`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validation 3: Run duration (5-180 seconds, consistent with client)
    if (runSeconds < 5 || runSeconds > 180) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid game duration',
          details: `Duration: ${runSeconds}s (allowed: 5-180s)`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validation 4: Rate limiting - check last submission time
    const { data: lastScore, error: lastScoreError } = await supabase
      .from('scores')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!lastScoreError && lastScore) {
      const lastSubmissionTime = new Date(lastScore.created_at).getTime()
      const timeSinceLastSubmission = now - lastSubmissionTime
      
      if (timeSinceLastSubmission < 60000) { // 60 seconds minimum between submissions
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Rate limit exceeded',
            details: `Wait ${Math.ceil((60000 - timeSinceLastSubmission) / 1000)}s before next submission`
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Insert score with server timestamp
    const { data: insertedScore, error: insertError } = await supabase
      .from('scores')
      .insert({
        user_id: user.id,
        score: score,
        run_seconds: runSeconds,
        tz: 'Europe/Rome'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to save score',
          details: insertError.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate user's position in leaderboard (optional)
    const { count: betterScores } = await supabase
      .from('scores')
      .select('*', { count: 'exact', head: true })
      .gt('score', score)

    const position = (betterScores || 0) + 1

    const response: ScoreResponse = {
      success: true,
      storedScore: {
        id: insertedScore.id,
        score: insertedScore.score,
        runSeconds: insertedScore.run_seconds,
        position
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Submit score error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})