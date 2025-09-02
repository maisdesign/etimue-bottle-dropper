# Etimuè Bottle Dropper

A Progressive Web App (PWA) bottle catching game built with Phaser 3, TypeScript, and Supabase.

## 🎮 Game Overview

Catch the right bottles (brown craft bottles) and avoid the wrong ones (green industrial bottles). Collect yellow stars for bonus points and extra time. You have 3 lives and 60 seconds to achieve the highest score!

## 🚀 Features

- ✅ **Full TypeScript implementation**
- ✅ **Progressive Web App (PWA)** with offline support
- ✅ **Multi-language support** (Italian/English)
- ✅ **User authentication** (Google, Apple, Email OTP)
- ✅ **Mailchimp newsletter integration**
- ✅ **Weekly/Monthly leaderboards**
- ✅ **GDPR compliant** with consent management
- ✅ **Mobile-responsive** with touch controls
- ✅ **Real-time scoring** with anti-cheat measures
- ✅ **Audio controls** with toggle functionality

## 📁 Project Structure

```
├── public/                 # Static assets (PWA icons, favicon)
├── src/
│   ├── assets/            # Game assets (sprites, audio)
│   ├── scenes/            # Phaser game scenes
│   │   ├── BootScene.ts   # Initial loading
│   │   ├── PreloadScene.ts # Asset loading
│   │   ├── MenuScene.ts   # Main menu with auth
│   │   ├── GameScene.ts   # Core gameplay
│   │   ├── GameOverScene.ts # Score submission
│   │   └── LeaderboardScene.ts # Rankings display
│   ├── ui/                # HTML/CSS UI components
│   │   └── AuthModal.ts   # Authentication modal
│   ├── i18n/              # Internationalization
│   │   ├── it.json        # Italian translations
│   │   ├── en.json        # English translations
│   │   └── index.ts       # i18n system
│   ├── net/               # Network services
│   │   ├── supabaseClient.ts # Database client
│   │   ├── authManager.ts # Authentication manager
│   │   ├── mailchimp.ts   # Newsletter service
│   │   ├── database_schema.sql # Database setup
│   │   └── edgeFns.md     # Serverless functions docs
│   └── main.ts            # App entry point
├── dist/                  # Build output
├── vite.config.ts         # Build configuration
└── README.md
```

## 🛠 Setup Instructions

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- Mailchimp account (optional)

### 1. Installation

```bash
git clone <repository-url>
cd etimue-bottle-dropper
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mailchimp Configuration (server-side only)
MC_API_KEY=your_mailchimp_api_key
MC_SERVER_PREFIX=us21
MC_LIST_ID=your_mailchimp_list_id

# Admin Configuration
VITE_ADMIN_UUIDS=uuid1,uuid2,uuid3
```

### 3. Database Setup

1. Create a new Supabase project
2. Enable authentication providers (Google, Apple)
3. Run the SQL commands from `src/net/database_schema.sql`
4. Configure RLS (Row Level Security) policies

### 4. Supabase Edge Functions (Optional)

For production, deploy these Edge Functions:

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy submit-score
supabase functions deploy mailchimp-subscribe

# Set secrets
supabase secrets set MC_API_KEY=your_mailchimp_api_key
supabase secrets set MC_SERVER_PREFIX=us21
supabase secrets set MC_LIST_ID=your_list_id
```

### 5. Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎮 Gameplay Controls

### Desktop
- **Movement**: ← → arrow keys or A/D keys
- **Pause**: P key or click pause button
- **ESC**: Return to menu (in various screens)

### Mobile
- **Movement**: Touch left/right buttons
- **Pause**: Tap pause button

## 📊 Scoring System

- **Good Bottles (Brown)**: +1 point
- **Bad Bottles (Green)**: -1 life (no points)
- **Power-up Stars**: +5 points + 5 seconds time
- **Lives**: Start with 3 lives
- **Time**: 60 seconds per game
- **Power-up Effect**: All bottles become good for 10 seconds

## 🔒 Authentication & GDPR

### Authentication Flow
1. User clicks "Play"
2. Sign in with Google/Apple/Email OTP
3. Mandatory newsletter consent
4. Profile creation with consent timestamp

### GDPR Compliance
- Cookie consent banner
- Analytics opt-in/out
- Marketing consent required for gameplay
- Data export capabilities (admin)
- Privacy policy and terms links

## 📈 Leaderboards

### Weekly Leaderboard
- Resets every Monday 00:00 (Europe/Rome)
- Shows top 50 players
- Real-time updates

### Monthly Leaderboard  
- Resets 1st of every month 00:00 (Europe/Rome)
- Shows top 50 players
- Historical data preserved

### Anti-Cheat Measures
- Score validation (max 600 points in 60 seconds)
- Game duration verification
- Rate limiting (1 submission per minute)
- Server-side timestamp validation
- Impossible score detection

## 🌐 Internationalization

The game supports Italian and English with automatic browser language detection.

### Adding New Languages

1. Create new translation file in `src/i18n/`
2. Add language to `getAvailableLanguages()` in `src/i18n/index.ts`
3. Update language selector in MenuScene

## 📱 PWA Features

- **Offline Support**: Game works without internet (except leaderboards)
- **Install Prompt**: Native app-like installation
- **App Manifest**: Proper PWA metadata
- **Service Worker**: Asset caching and offline functionality
- **Mobile Optimized**: Touch controls and responsive design

## 🚀 Deployment

### Static Hosting (Recommended)

The built files in `/dist` can be deployed to any static hosting service:

- **Netlify**: Drag & drop `/dist` folder
- **Vercel**: Connect GitHub repository
- **GitHub Pages**: Use GitHub Actions
- **Firebase Hosting**: `firebase deploy`

### Environment Setup for Production

Ensure these are configured in your hosting environment:

1. **Supabase Edge Functions** for secure score submission
2. **Environment variables** for sensitive data
3. **HTTPS** for PWA and OAuth requirements
4. **Custom domain** for production use

### Hosting Configuration

For SPA routing, configure your host to serve `index.html` for all routes.

Example Netlify `_redirects`:
```
/*    /index.html   200
```

## 🔧 Development Notes

### Asset Optimization

- Sprites are generated programmatically (no external files needed)
- Replace generated sprites with real assets in `src/scenes/PreloadScene.ts`
- Audio files are currently silent placeholders

### Performance Considerations

- Object pooling for game objects
- Mobile-specific optimizations
- Automatic cleanup of off-screen objects
- 60 FPS target with delta time integration

### Testing

- Test authentication flow thoroughly
- Verify leaderboard timezone calculations
- Test PWA installation on various devices
- Validate mobile touch controls

## 📝 License

This project is proprietary software for Etimuè.

## 🤝 Contributing

This is a private project. Contact the development team for contribution guidelines.

## 📞 Support

For technical issues or questions, create an issue in the project repository.

---

Built with ❤️ for Etimuè using Phaser 3, TypeScript, and Supabase.

<!-- Deployment test commit -->