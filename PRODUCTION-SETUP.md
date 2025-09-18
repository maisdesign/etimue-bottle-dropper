# 🚀 Production Setup Guide - URGENT FIXES

## Current Issues
- ❌ Google OAuth not working (friend cannot login)
- ❌ Leaderboard not showing after game
- ⚠️ Email/password works but limited functionality

## 🔥 CRITICAL FIXES NEEDED

### 1. Netlify Environment Variables
**Go to Netlify Dashboard** → `etimuebottledropper` → **Site settings** → **Environment variables**

Add these variables:
```
VITE_SUPABASE_URL=https://xtpfssiraytzvdvgrsol.supabase.co 
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh0cGZzc2lyYXl0enZkdmdyc29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyNjM1NzcsImV4cCI6MjA3MTgzOTU3N30.sr3C3c9vEC2yuM4k503_EcXjKp7kfX5TZx9uBM53UOw
VITE_ADMIN_UUIDS=470c82f5-3997-4d93-a433-4dfee4a199c2
```

### 2. Supabase OAuth Configuration
**Go to Supabase Dashboard** → **Authentication** → **URL Configuration**

**Site URL:** `https://etimuebottledropper.netlify.app`

**Redirect URLs (add these):**
```
https://etimuebottledropper.netlify.app
https://etimuebottledropper.netlify.app/#auth-callback
https://etimuebottledropper.netlify.app/
```

### 3. Google OAuth Console
**Go to Google Cloud Console** → **APIs & Credentials** → **OAuth 2.0 Client**

**Authorized redirect URIs (add):**
```
https://xtpfssiraytzvdvgrsol.supabase.co/auth/v1/callback
```

**Authorized JavaScript origins (add):**
```
https://etimuebottledropper.netlify.app
```

### 4. Supabase Database Access
**Go to Supabase Dashboard** → **Settings** → **API**

Verify **Allowed Origins** includes:
```
https://etimuebottledropper.netlify.app
*
```

## 🧪 Testing Steps

After making changes:

1. **Redeploy Netlify** (trigger new build to pickup environment variables)
2. **Test Google Login** - Should work without redirecting to localhost
3. **Test Game Flow** - Play game → submit score → see leaderboard
4. **Test Email Login** - Should work as backup

## 🔍 Debug Console Commands

If still having issues, check browser console (F12) on production site:

```javascript
// Check environment variables are loaded
console.log(import.meta.env.VITE_SUPABASE_URL)

// Check Supabase connection
console.log(window.supabase?.auth?.getUser())

// Check current URL and redirect handling  
console.log(window.location.href)
```

## ⚡ Quick Fix Order

1. **Netlify env vars** (5 minutes)
2. **Supabase URL config** (2 minutes) 
3. **Google OAuth redirect** (3 minutes)
4. **Test & verify** (5 minutes)

**Total fix time: ~15 minutes**