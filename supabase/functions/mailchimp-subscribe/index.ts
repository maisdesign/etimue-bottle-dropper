// Supabase Edge Function per l'iscrizione alla newsletter Mailchimp
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SubscribeRequest {
  email: string
  userId: string
  displayName?: string
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
    const { email, userId, displayName }: SubscribeRequest = await req.json()

    if (!email || !userId) {
      return new Response(JSON.stringify({ error: 'Email and user ID are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // Verify user exists and get authorization header
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

    // Extract datacenter from API key (e.g., "us19" from key ending with "-us19")
    const datacenter = MAILCHIMP_API_KEY.split('-').pop()
    const mailchimpUrl = `https://${datacenter}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`

    // Prepare Mailchimp request
    const mailchimpData = {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: displayName || email.split('@')[0],
        SOURCE: 'Etimuè Bottle Dropper Game'
      },
      tags: ['game-player', 'etimue-bottle-dropper']
    }

    // Subscribe to Mailchimp
    const mailchimpResponse = await fetch(mailchimpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `apikey ${MAILCHIMP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mailchimpData)
    })

    const mailchimpResult = await mailchimpResponse.json()

    if (!mailchimpResponse.ok) {
      console.error('Mailchimp error:', mailchimpResult)
      console.log('🔍 DEBUG: DETAILED MAILCHIMP ANALYSIS')
      console.log('🔍 Title exists:', !!mailchimpResult.title)
      console.log('🔍 Title value:', JSON.stringify(mailchimpResult.title))
      console.log('🔍 Title length:', mailchimpResult.title ? mailchimpResult.title.length : 'null')
      console.log('🔍 Detail exists:', !!mailchimpResult.detail)
      console.log('🔍 Detail value:', JSON.stringify(mailchimpResult.detail))
      console.log('🔍 Full response keys:', Object.keys(mailchimpResult))
      console.log('🔍 Full Mailchimp response:', JSON.stringify(mailchimpResult, null, 2))

      // Handle already subscribed case
      if (mailchimpResult.title === 'Member Exists') {
        console.log('DEBUG: Matched Member Exists case')

        // 🔧 FIX: Update database even when already subscribed to ensure sync
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            consent_marketing: true,
            consent_ts: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) {
          console.error('Failed to update profile consent for existing subscriber:', updateError)
        } else {
          console.log('✅ Database synced for existing subscriber')
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Already subscribed',
          alreadySubscribed: true
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // Handle permanently deleted email case - check multiple possible indicators
      const forgottenEmailTitles = [
        'Forgotten Email Not Subscribed',
        'Forgotten Email',
        'Member In Compliance State',
        'Compliance Related'
      ];

      const forgottenEmailDetails = [
        'permanently deleted',
        'cannot be re-imported',
        'was previously unsubscribed',
        'must re-subscribe to get back',
        'compliance state',
        'cannot be re-added',
        'contact must re-subscribe',
        'unsubscribed and cannot be',
        'deleted and cannot be'
      ];

      console.log('🔍 TESTING TITLE MATCHES:')
      forgottenEmailTitles.forEach(title => {
        const matches = mailchimpResult.title && mailchimpResult.title.includes(title)
        console.log(`🔍 "${title}" matches: ${matches}`)
      })

      console.log('🔍 TESTING DETAIL MATCHES:')
      forgottenEmailDetails.forEach(detail => {
        const matches = mailchimpResult.detail && mailchimpResult.detail.toLowerCase().includes(detail)
        console.log(`🔍 "${detail}" matches: ${matches}`)
      })

      const titleMatches = forgottenEmailTitles.some(title =>
        mailchimpResult.title && mailchimpResult.title.includes(title)
      )
      const detailMatches = forgottenEmailDetails.some(detail =>
        mailchimpResult.detail && mailchimpResult.detail.toLowerCase().includes(detail)
      )

      console.log('🔍 Title matches any:', titleMatches)
      console.log('🔍 Detail matches any:', detailMatches)

      const isPermanentlyDeleted = titleMatches || detailMatches

      console.log('🔍 FINAL isPermanentlyDeleted:', isPermanentlyDeleted)

      if (isPermanentlyDeleted) {
        console.log('✅ MATCHED! Returning isPermanentlyDeleted: true')
        console.log('✅ Matched title was:', mailchimpResult.title)
        console.log('✅ Matched detail was:', mailchimpResult.detail)
        return new Response(JSON.stringify({
          success: false,
          error: 'This email was previously unsubscribed and cannot be re-added automatically. Please use our <a href="https://facebook.us7.list-manage.com/subscribe?u=aacb79a7271a37e78eb76ebb9&id=e1cc02e51c" target="_blank" style="color: #FFD700; text-decoration: underline; font-weight: bold;">official signup form</a> or try a different email address.',
          isPermanentlyDeleted: true
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log('DEBUG: No specific case matched, checking if it could be permanently deleted')

      // If it's a 400 error and contains certain keywords, assume it might be permanently deleted
      const errorText = (mailchimpResult.detail || mailchimpResult.error || '').toLowerCase()
      const couldBePermanentlyDeleted =
        errorText.includes('unsubscribed') ||
        errorText.includes('deleted') ||
        errorText.includes('cannot be') ||
        errorText.includes('previously') ||
        errorText.includes('re-add')

      if (couldBePermanentlyDeleted) {
        console.log('DEBUG: Error text suggests permanently deleted - returning isPermanentlyDeleted: true')
        console.log('DEBUG: Error text was:', errorText)
        return new Response(JSON.stringify({
          success: false,
          error: 'This email was previously unsubscribed and cannot be re-added automatically. Please contact support or use a different email address.',
          isPermanentlyDeleted: true
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      console.log('DEBUG: Using generic error')

      return new Response(JSON.stringify({
        error: 'Failed to subscribe to newsletter',
        details: mailchimpResult.detail
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Update user profile in database to mark marketing consent
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        consent_marketing: true,
        consent_ts: new Date().toISOString()
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Failed to update profile consent:', updateError)
    }

    console.log('Newsletter subscription successful:', { email, userId })

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully subscribed to newsletter',
      mailchimpId: mailchimpResult.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Newsletter subscription error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})