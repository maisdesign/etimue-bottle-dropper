# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Development
- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production (outputs to `dist/`)
- `npm run preview` - Preview production build locally

### CRITICAL DEPLOYMENT WORKFLOW
**⚠️ ALWAYS FOLLOW THIS SEQUENCE FOR EVERY CHANGE:**
1. Make code changes to source files
2. Run `npm run build` to update dist/ folder
3. Run `git add .` to stage ALL files (including dist/)
4. Commit with descriptive message
5. Push to deploy to Netlify (Netlify reads from dist/ folder)

**🚨 NEVER SKIP THE BUILD STEP** - Netlify only shows what's in the dist/ folder!

### Database Management
Use the Supabase CLI for database operations:
- `supabase link --project-ref xtpfssiraytzvdvgrsol` - Link to Supabase project
- `supabase functions deploy submit-score` - Deploy score submission edge function
- `supabase functions deploy mailchimp-subscribe` - Deploy newsletter subscription function

## Project Status (as of September 7, 2025 - 03:00)

**✅ CHARLIE IMPLEMENTATION COMPLETED** - Character selection system fully working and deployed.

### Recently Completed Features
- ✅ **NUCLEAR WASD Fix**: Fully resolved double character insertion bug in input fields after gameplay
- ✅ **Charlie Character Selection**: Clickable mascot with modal for character selection (Charlie, Scrocca, Irlandese)  
- ✅ **Homepage Auth Button**: Clickable profile/login button in header area
- ✅ **Character Selection System**: Complete implementation with localStorage persistence and modal UI
- ✅ **Build Deployment**: All dist/ files properly committed and deployed to Netlify

### MOBILE UX COMPLETED
- ✅ **Charlie Mobile Indicators**: Enhanced 28px orange gradient bounce badge with 🎭 emoji
- ✅ **Responsive Design**: Mobile-first clamp() typography and modal optimization  
- ✅ **Italian Translations**: Full IT/EN localization in character selection modal
- ✅ **Touch Interactions**: Proper mobile clickability and visual feedback

### PREVIOUS CRITICAL ISSUES (RESOLVED)
- ✅ **Homepage Auth Button Bugs**: Auth flow working correctly
- ✅ **Build Corruption**: Vite build corruption of authModal.show() - workaround implemented

### Current Working State  
- ✅ Google OAuth authentication working completely (production OAuth URLs configured)
- ✅ Game fully playable with score submission
- ✅ Nickname system with profanity filtering implemented (but broken on homepage)
- ✅ Leaderboards with correct UI alignment and translations
- ✅ WASD keyboard fix working perfectly (nuclear solution deployed)
- ✅ Database connectivity verified and working
- ✅ Character assets optimized and ready (Charlie, Scrocca, Irlandese at 256px ~58KB each)
- ✅ All translations verified and correct (IT/EN) 
- ✅ Site deployed at: https://astounding-rolypoly-fc5137.netlify.app/ with OAuth properly configured

### Screenshots Available
- 🧹 Screenshots folder cleaned (iPhone UX issues resolved)
- 📊 Advanced logger debug data available for debugging session duration and bugs

### Environment Configuration
- Supabase URL: `https://xtpfssiraytzvdvgrsol.supabase.co`
- Admin UUID: `470c82f5-3997-4d93-a433-4dfee4a199c2`
- Current dev server: port 3000 (`http://localhost:3000`)
- Game title: **"Etimuè Bottle Dropper"** (not "Etimüè")

## Architecture Overview

This is a **Etimuè Bottle Dropper** - a Phaser 3 TypeScript game that integrates with Supabase for authentication, user profiles, and leaderboards. The application follows a scene-based architecture with centralized state management.

### Core Architecture Components

**Game Engine**: Phaser 3 with TypeScript, configured in `src/main.ts` with scenes loaded in sequence

**Authentication Flow**: 
- AuthManager (`src/net/authManager.ts`) handles OAuth with Google and email OTP
- AuthModal (`src/ui/AuthModal.ts`) provides UI for authentication with nickname system  
- Mandatory marketing consent required for gameplay
- OAuth callback handling with hash-based redirects
- **FIXED**: Double hash issue resolved, OAuth loop eliminated
- **UPDATED**: Apple OAuth removed (not configured in Supabase)

**Database Integration**:
- Supabase client (`src/net/supabaseClient.ts`) with typed interfaces
- Profiles auto-created via database trigger
- Anti-cheat validation in score submission (0-600 points, min 5 seconds duration)
- Weekly/monthly leaderboards with timezone handling (Europe/Rome)
- **FIXED**: Score submission database constraint issues resolved

**Scene Flow**:
1. BootScene → PreloadScene → MenuScene (auth required)
2. GameScene (main gameplay)
3. GameOverScene (score submission) → LeaderboardScene

### Key Technical Details

**Path Aliases**: Uses `@/` prefix for src imports with Vite/TypeScript resolution:
```typescript
'@/*': ['src/*']
'@/scenes/*': ['src/scenes/*']
'@/net/*': ['src/net/*']
'@/ui/*': ['src/ui/*']
'@/i18n/*': ['src/i18n/*']
'@/net/*': ['src/net/*']
```

**Mobile Support**: Touch controls implemented in GameScene with responsive scaling

**PWA Configuration**: Service worker with Supabase caching, offline support

**Internationalization**: i18n system (`src/i18n/`) supports Italian/English with browser detection

**Nickname System**: 
- Anti-profanity filtering (multilingual IT/EN)
- Validation: 2-20 characters, safe characters only
- Profile modal for existing users to update nicknames
- **FIXED**: Modal cleanup and HTML input positioning

**Environment Variables**:
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` for database connection
- `VITE_ADMIN_UUIDS` for admin user identification
- Mailchimp credentials for server-side edge functions

### Anti-Cheat System

Score submission includes validation:
- Score range: 0-600 points
- Game duration: minimum 5 seconds (no artificial upper limit for skilled players)
- Rate limiting and server-side timestamp validation
- **FIXED**: Removed artificial 70-second limit for expert players

### GDPR Compliance

- Cookie consent banner in MenuScene
- Marketing consent required before gameplay
- Consent timestamp stored in profiles
- Privacy policy and terms integration

### Recent Updates (September 6, 2025)

**🔴 URGENT SESSION NOTES (September 6, 2025 - 00:45)**:
- **Session Duration**: Approaching 5-hour limit, may need interruption soon
- **Critical Bugs Found**: Homepage auth button implementation has 3 major bugs requiring immediate fixes:
  1. **Nickname Change Broken**: Clicking OK shows advanced logger modal instead of profile edit
  2. **Language Switch Bug**: After login, changing language reverts button text to "LOGIN" 
  3. **Auth Flow Wrong**: Should show profile modal for nickname change, not auth modal
- **Debug Data**: Screenshots available in Screenshots/ folder showing auth button bugs (ITA/ENG versions)
- **Next Actions Required**: Fix nickname change flow, language switching persistence, and modal routing

### Previous Updates (September 3, 2025)

**🐛 CRITICAL BUG FOUND & FIXED - OAuth Double Hash Issue**:
- 🔍 **Bug**: OAuth callback URL contained double hash: `#auth-callback#access_token=...` instead of proper format
- 🔍 **Impact**: New user authentication failing in production - tokens present but not processed by Supabase
- ✅ **Fix**: Removed `#auth-callback` from redirect URL, using clean root URL redirect
- ✅ **Fix**: Improved OAuth callback detection to handle all token types and force refresh when needed
- ✅ **Fix**: Extended auth processing timeout from 1.5s to 8s for better reliability
- ✅ **Testing**: Deployed and working in production

**🐛 PROFILE NICKNAME DUPLICATION BUG FOUND & FIXED**:
- 🔍 **Bug**: Profile modal and Auth modal not synchronized - user sets nickname in Profile, then asked again in Game
- 🔍 **Impact**: User gets "nickname already taken" error when using their own nickname set via Profile modal
- ✅ **Fix**: AuthModal now pre-fills nickname from existing profile data when showing consent step
- ✅ **Fix**: Nickname availability check now excludes current user's existing nickname
- ✅ **Fix**: Improved profile data synchronization between modals
- ✅ **Testing**: Deployed and working in production

**🔧 UI CLEANUP - Apple OAuth Removed**:
- 🗑️ **Removed**: Apple login button from authentication modal (not configured in Supabase)
- 🗑️ **Cleaned**: Apple-specific CSS styles and event handlers removed
- 🗑️ **Updated**: Translations cleaned (removed continueWithApple strings)
- ✅ **Simplified**: Authentication UI now shows only Google and Email options

**✨ NEW FEATURE - Prizes Modal Added**:
- 🆕 **Added**: "Cosa si vince" (What You Win) button in main menu
- 🏆 **Weekly Prize**: 5% discount on dinner at Etimuè pub for weekly leaderboard winner
- 🥇 **Monthly Prize**: 10% discount on dinner at Etimuè pub for monthly leaderboard winner
- 🎨 **UI**: Golden button styling to highlight the prizes feature  
- 🌍 **Translations**: Full IT/EN support for all prize descriptions
- 🎯 **Purpose**: Encourage player engagement with clear reward incentives

**Production Deployment Status**:
- ⚠️ **Requires Update**: New build needs deployment with prizes feature
- ✅ Google Cloud Console OAuth redirect URLs properly configured for production  
- ✅ Netlify production site at https://astounding-rolypoly-fc5137.netlify.app/ (pending update)
- ✅ OAuth authentication working in production
- ✅ Profile nickname duplication resolved  
- ✅ Apple OAuth removed and UI simplified
- ✅ Prizes modal feature ready for deployment

**Character Selection System Prepared**:
- ✅ Character images analyzed and optimized: Charlie (punk cat), Scrocca (party cat), Irlandese (lucky Irish cat)
- ✅ Images resized from 4.6MB/3.3MB/793KB to ~58KB each (256px width)
- ✅ Character assets moved to public/characters/ directory
- ✅ Character selection screen architecture planned and ready for implementation

**Code Quality Verification**:
- ✅ All translation files (IT/EN) verified and correct
- ✅ File structure and configuration reviewed and confirmed working
- ⚠️ **Auth Fix Applied**: OAuth callback processing improved and double-hash issue resolved

## Development Notes

- Database currently forces 60-second duration constraint (marked for future update)
- Audio files are placeholder (silent) - replace in PreloadScene for production  
- Sprites are programmatically generated - replace with real assets as needed
- OAuth callback uses hash-based routing (`#auth-callback`) for SPA compatibility
- All major functionality tested and working on development server

## Debugging Tips

### Console JavaScript
Check browser console errors when:
1. Logging in with Google OAuth
2. Returning to menu after login
3. Accessing the game
4. Submitting scores
5. Loading leaderboards

### AuthManager Logging
The `authManager.ts` file has active logging:
```javascript
console.log('Auth state changed:', event, session?.user?.email)
```

### Score Service Logging
Extensive logging in score submission for tracking issues:
```javascript
console.log('📊 ScoreService.submitScore called:', { userId, score, runSeconds })
```

## Ready for Further Development

The system is **PRODUCTION READY** and deployed. Ready for character selection system implementation.

### Production Deployment Status
- ✅ Site live at https://astounding-rolypoly-fc5137.netlify.app/
- ✅ All features tested and working in production
- ✅ Authentication flow complete with Google OAuth
- ✅ Database connectivity verified
- ✅ UI bugs fixed and stable
- ✅ Anti-cheat system working
- ✅ Nickname system functional
- ✅ Leaderboards displaying correctly

### Next Development Phase - Character Selection
- 🎯 CharacterManager system implementation
- 🎯 CharacterSelectScene creation
- 🎯 Integration with existing game flow
- 🎯 Player sprite replacement system
- 🎯 LocalStorage persistence for character choice
- Aggiorna SITUAZIONE_PROGETTO.md ogni volta che troviamo un bug o lo risolviamo, anche ogni volta che pensiamo ad una nuova feature o la implementiamo
- Controlla sempre se ci sono screenshot, leggili e poi cancellali
- memory Netlify gets its file from the dist folder so to push things online we have to build and then push the changes there.\
Other files are for the local version of the game
- I file dist non sono ignorati, sono quello che fa funzionare Netlify
- committa ogni modifica
- ricordati di buildare ogni volta perché la versione online pesca dalla cartella dist
- Lo sviluppo funziona in questo modo, tutti i file vanno qui: https://github.com/maisdesign/etimue-bottle-dropper\
I file presenti nella cartella dist invece vanno qui: https://github.com/maisdesign/bottledropper\
Perché il progetto Netlify ( https://astounding-rolypoly-fc5137.netlify.app/) mostra quello che è presente nella cartella dist
- 1)In homepage devono essere presenti       │
│   questi pulsanti:\                          │
│   2)Gioca -> se login eseguito fa partire    │
│   la partita, altrimenti login e poi         │
│   partita.\                                  │
│   3)Classifica -> mostra la classifica se    │
│   si è loggati\                              │
│   4)Come si gioca -> Mostra regole ed        │
│   istruzioni\                                │
│   5)Cosa si vince -> spiega i premi e la     │
│   modalità per riceverli\                    │
│   6)Audio -> On/Off (audio da implementare   │
│   ma lo faremo successivamente)\             │
│   7)Lingua -> Switch ITA/ENG\                │
│   8)Privacy -> Manda alla pagina privacy     │
│   (da implementare)\                         │
│   9)Termini -> Manda alla pagina termini     │
│   (da implementare)\                         │
│   10)V0.1 homepage -> iniziamo a modificare  │
│   anche quella ad ogni commit così mi        │
│   posso rendere conto più velocemente se     │
│   Netlify ha la versione più recente oppure  │
│   no. Direi che la prossima versione sarà:   │
│   v0.1000 e quella successiva : v0.1001\     │
│   In alto a dx pulsante per il cambio        │
│   lingua (mi va bene un poco di              │
│   ridondanza)\                               │
│   11)Pulsante per acesso -> cliccandolo      │
│   deve triggerare la procedura di accesso    │
│   ma non fare partire subito il gioco. Mi    │
│   va bene mostri il nickname selezionato ma  │
│   deve rimanere visibile quando si cambia    │
│   lingua (al momento sparisce).\Cliccandolo  │
│   dopo avere eseguito il login deve aprire   │
│   una schermata che permette di cambiare     │
│   il nickname o eseguire il logout.\         │
│   12)cambio di personaggio cliccando su      │
│   Charlie in homepage
- il sync changes non è su Netlify ma su VS Code
- i file nella cartella dist sono quelli che alla fine vengono caricati su netlify