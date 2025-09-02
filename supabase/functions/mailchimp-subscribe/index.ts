import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, firstName, lastName, consent } = await req.json()

    if (!consent) {
      return new Response(
        JSON.stringify({ success: false, error: 'User consent is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Get Mailchimp credentials from environment
    const apiKey = Deno.env.get('MAILCHIMP_API_KEY')
    const serverPrefix = Deno.env.get('MAILCHIMP_SERVER_PREFIX')
    const listId = Deno.env.get('MAILCHIMP_LIST_ID')

    if (!apiKey || !serverPrefix || !listId) {
      console.error('Missing Mailchimp configuration')
      return new Response(
        JSON.stringify({ success: false, error: 'Mailchimp not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log(`📧 Attempting to subscribe: ${email} to list: ${listId}`)

    // Subscribe to Mailchimp
    const mailchimpResponse = await fetch(
      `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${listId}/members`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email_address: email,
          status: 'subscribed',
          merge_fields: {
            FNAME: firstName || '',
            LNAME: lastName || ''
          }
        })
      }
    )

    const mailchimpData = await mailchimpResponse.json()

    // Handle different response cases
    if (mailchimpResponse.status === 400 && mailchimpData.title === 'Member Exists') {
      console.log(`✅ User ${email} already subscribed`)
      return new Response(
        JSON.stringify({ success: true, message: 'Already subscribed' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!mailchimpResponse.ok) {
      console.error('Mailchimp API error:', mailchimpData)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Mailchimp error: ${mailchimpData.detail || mailchimpData.title || 'Unknown error'}` 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log(`✅ Successfully subscribed: ${email}`)
    return new Response(
      JSON.stringify({ success: true, message: 'Successfully subscribed to newsletter' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})