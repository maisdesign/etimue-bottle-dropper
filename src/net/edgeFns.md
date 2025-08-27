# Supabase Edge Functions

This document outlines the Edge Functions needed for the Etimüè Bottle Dropper game.

## Required Edge Functions

### 1. submit-score

**Purpose**: Validate and submit game scores with anti-cheat measures

**Endpoint**: `POST /functions/v1/submit-score`

**Request Body**:
```json
{
  "score": 150,
  "runSeconds": 60,
  "gameEndTimestamp": 1703123456789,
  "clientTimestamp": 1703123456789
}
```

**Validation Rules**:
- Score must be between 0 and 600
- Run duration must be exactly 60 seconds  
- Game end timestamp must be within 10 seconds of current server time
- Rate limit: max 1 submission per minute per user
- Detect impossible scores (e.g. >10 points per second sustained)

**Response**:
```json
{
  "success": true,
  "score": 150,
  "position": 12,
  "message": "Score submitted successfully"
}
```

### 2. mailchimp-subscribe

**Purpose**: Securely handle Mailchimp newsletter subscriptions

**Endpoint**: `POST /functions/v1/mailchimp-subscribe`

**Request Body**:
```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe", 
  "consent": true
}
```

**Environment Variables Required**:
- `MC_API_KEY`: Mailchimp API key
- `MC_SERVER_PREFIX`: Mailchimp server prefix (e.g., us21)
- `MC_LIST_ID`: Mailchimp list ID

**Response**:
```json
{
  "success": true,
  "message": "Successfully subscribed to newsletter"
}
```

### 3. admin-export (Optional)

**Purpose**: Export leaderboard data for admins

**Endpoint**: `GET /functions/v1/admin-export`

**Query Parameters**:
- `period`: "weekly" | "monthly" | "all"
- `format`: "csv" | "json"
- `limit`: number (default 1000)

**Authorization**: Requires admin claim in JWT

**Response**: CSV or JSON data export

## Implementation Examples

### submit-score.ts
```typescript
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: user } = await supabase.auth.getUser(token)

    if (!user) {
      throw new Error('Unauthorized')
    }

    const { score, runSeconds, gameEndTimestamp, clientTimestamp } = await req.json()

    // Anti-cheat validation
    const serverTime = Date.now()
    const timeDiff = Math.abs(serverTime - gameEndTimestamp)
    
    if (timeDiff > 10000) { // 10 seconds tolerance
      throw new Error('Invalid game end timestamp')
    }

    if (score < 0 || score > 600) {
      throw new Error('Invalid score range')
    }

    if (runSeconds !== 60) {
      throw new Error('Invalid run duration')
    }

    // Rate limiting check (implement based on your needs)
    
    // Insert score
    const { data, error } = await supabase
      .from('scores')
      .insert({
        user_id: user.user.id,
        score,
        run_seconds: runSeconds,
        tz: 'Europe/Rome'
      })
      .select()
      .single()

    if (error) throw error

    return new Response(
      JSON.stringify({ 
        success: true, 
        score: data.score,
        message: 'Score submitted successfully' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

### mailchimp-subscribe.ts
```typescript
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, firstName, lastName, consent } = await req.json()

    if (!consent) {
      throw new Error('User consent is required')
    }

    const response = await fetch(
      `https://${Deno.env.get('MC_SERVER_PREFIX')}.api.mailchimp.com/3.0/lists/${Deno.env.get('MC_LIST_ID')}/members`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('MC_API_KEY')}`,
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

    // Handle "already subscribed" case
    if (response.status === 400) {
      const errorData = await response.json()
      if (errorData.title === 'Member Exists') {
        return new Response(
          JSON.stringify({ success: true, message: 'Already subscribed' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (!response.ok) {
      throw new Error(`Mailchimp API error: ${response.status}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Successfully subscribed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

## Deployment

Deploy these functions to Supabase:

```bash
supabase functions deploy submit-score
supabase functions deploy mailchimp-subscribe
supabase functions deploy admin-export
```

Make sure to set the required environment variables:

```bash
supabase secrets set MC_API_KEY=your_mailchimp_api_key
supabase secrets set MC_SERVER_PREFIX=us21
supabase secrets set MC_LIST_ID=your_list_id
```