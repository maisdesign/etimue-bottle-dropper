// Supabase Edge Function to verify if user is subscribed to Mailchimp newsletter
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createHash } from 'https://deno.land/std@0.177.0/node/crypto.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VerifyRequest {
  email: string
  userId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify this is a POST request
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Get environment variables
    const MAILCHIMP_API_KEY = Deno.env.get('MC_API_KEY')
    const MAILCHIMP_LIST_ID = Deno.env.get('MC_LIST_ID')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID) {
      console.error('Missing Mailchimp configuration')
      return new Response(JSON.stringify({ error: 'Newsletter service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Parse request body
    const { email, userId }: VerifyRequest = await req.json()

    if (!email || !userId) {
      return new Response(JSON.stringify({ error: 'Email and user ID are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Verify user authorization
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user || user.id !== userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Extract datacenter from API key
    const datacenter = MAILCHIMP_API_KEY.split('-').pop()

    // Generate subscriber hash (MD5 of lowercase email)
    const subscriberHash = createHash('md5').update(email.toLowerCase()).digest('hex')

    // Check if email exists in Mailchimp list
    const mailchimpUrl = `https://${datacenter}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`

    console.log('🔍 Verifying subscription for:', email)
    console.log('🔍 Subscriber hash:', subscriberHash)

    const mailchimpResponse = await fetch(mailchimpUrl, {
      method: 'GET',
      headers: {
        'Authorization': `apikey ${MAILCHIMP_API_KEY}`,
      },
    })

    const mailchimpResult = await mailchimpResponse.json()

    console.log('🔍 Mailchimp response status:', mailchimpResponse.status)
    console.log('🔍 Mailchimp result:', mailchimpResult)

    // Check if user is subscribed
    if (mailchimpResponse.ok && mailchimpResult.status === 'subscribed') {
      console.log('✅ User is subscribed, updating database')

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          consent_marketing: true,
          consent_ts: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Failed to update profile consent:', updateError)
        return new Response(JSON.stringify({
          error: 'Failed to update profile',
          details: updateError
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify({
        success: true,
        subscribed: true,
        message: 'Subscription verified and profile updated'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // User not subscribed or other status
    console.log('❌ User not subscribed or invalid status:', mailchimpResult.status)

    return new Response(JSON.stringify({
      success: false,
      subscribed: false,
      message: 'Email not found in newsletter subscribers',
      mailchimpStatus: mailchimpResult.status || 'not_found'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Newsletter verification error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
