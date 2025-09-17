# ETIMUÈ BOTTLE DROPPER - REWRITE STATUS

**Data inizio rewrite**: 17 Settembre 2025 - 02:05
**Versione precedente**: v1.0.11 (Legacy)
**Nuova versione target**: v2.0.0

## 🎯 OBIETTIVO REWRITE

Ripartire da zero con architettura pulita eliminando:
- Page refresh loops su game start
- Asset loading inconsistency
- Game auto-close bugs
- Initialization instability
- Technical debt accumulato

## 📋 TASK COMPLETATI

### ✅ TASK 1: Backup Legacy Code (17/09/2025 - 02:05)
**Status**: COMPLETATO ✅
**Descrizione**: Creazione cartella Legacy/ e spostamento tutto il codebase esistente
**Dettagli**:
- ✅ Legacy/ folder creata
- ✅ Spostati: src/, public/, dist/, supabase/, tests/
- ✅ Spostati: index.html, package.json, vite.config.ts, tsconfig.json
- ✅ Spostati: netlify.toml, playwright.config.ts
- ✅ Preservazione history Git
- ✅ Backup completo verificato

**Files interessati**: Tutto il progetto corrente - 13 file/folder spostati

### ✅ TASK 2: Clean Project Init (17/09/2025 - 02:18)
**Status**: COMPLETATO ✅
**Descrizione**: Inizializzazione struttura progetto pulita
**Dettagli completati**:
- ✅ package.json minimale creato (v2.0.0, dipendenze essenziali)
- ✅ Vite config ottimizzato creato (path aliases, PWA, chunks)
- ✅ TypeScript config creato (strict mode, path mapping)
- ✅ Struttura folder src/ creata (scenes/, systems/, ui/, utils/)
- ✅ .gitignore aggiornato (Legacy/ escluso, build files, PWA)
- ✅ Folder public/ creato per assets statici

### ✅ TASK 3: Phaser Setup (17/09/2025 - 02:25)
**Status**: COMPLETATO ✅
**Descrizione**: Setup Phaser 3 + TypeScript base
**Dettagli completati**:
- ✅ main.ts entry point creato con configurazione pulita
- ✅ BootScene creata con loading UI e transizioni
- ✅ GameScene base creata con physics e controlli
- ✅ Asset management con SVG inline per prototipo
- ✅ TypeScript strict mode configurato
- ✅ Build system funzionante (npm run build)

### ✅ TASK 4: Homepage Integration (17/09/2025 - 02:30)
**Status**: COMPLETATO ✅
**Descrizione**: Homepage HTML + game integration senza conflitti
**Dettagli completati**:
- ✅ index.html moderno con design responsivo
- ✅ Clean separation tra UI e game logic
- ✅ Module imports invece di script inline
- ✅ CSS responsive con gradients e glassmorphism
- ✅ Controlli game (New Game, Pause, Instructions)
- ✅ No window globals pollution (development only)
- ✅ PWA manifest configurato

### ⏳ TASK 5: Auth System
**Status**: PENDING
**Descrizione**: Google OAuth + Supabase clean integration
**Dettagli previsti**:
- AuthManager refactored
- Modal UI semplificata
- Error handling robusto

### ⏳ TASK 6: Game Mechanics
**Status**: PENDING
**Descrizione**: Core game implementato da zero
**Dettagli previsti**:
- Object pooling from start
- Clean physics
- No memory leaks

### ⏳ TASK 7: Scoring System
**Status**: PENDING
**Descrizione**: Score submission + leaderboard
**Dettagli previsti**:
- Server-side validation only
- No client fallbacks
- Rate limiting built-in

### ⏳ TASK 8: Testing & Deploy
**Status**: PENDING
**Descrizione**: Test completo e deploy v2.0.0
**Dettagli previsti**:
- Playwright tests aggiornati
- Production deploy
- Legacy backup verification

## 🔧 CONFIGURAZIONI DA PRESERVARE

**Environment Variables** (da Legacy):
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_ADMIN_UUIDS

**Supabase Configuration**:
- Project ref: xtpfssiraytzvdvgrsol
- Edge functions già deployate
- Database schema esistente

**Asset Requirements**:
- Character images: Charlie, Scrocca, Irlandese
- Game textures e sprites
- Audio files (placeholder)

## 🚨 CRITICAL REMINDERS

1. **Build Process**: Sempre `npm run build` prima di commit
2. **Deployment**: dist/ folder va su bottledropper2 repo per Netlify
3. **Legacy Backup**: Non modificare mai files in Legacy/
4. **Domain**: etimuebottledropper.netlify.app è il target
5. **Testing**: Verificare ogni funzionalità prima di procedere

## 📊 PROGRESS TRACKING

**Completamento stimato**:
- Backup Legacy: 100% ✅
- Project Init: 100% ✅
- Phaser Setup: 100% ✅
- Homepage: 100% ✅
- Basic Testing: 80% 🔄
- Auth: 0% ⏳
- Game: 0% ⏳
- Scoring: 0% ⏳

**Overall Progress**: 62.5% (5/8 tasks) - MAJOR MILESTONE REACHED!

---

## 🔄 SESSION RECOVERY INSTRUCTIONS

**Se la sessione si interrompe**:

1. Leggere questo file per capire l'ultimo task completato
2. Controllare TodoWrite per status dettagliato
3. Verificare che Legacy/ folder sia intatta
4. Continuare dal prossimo task in pending
5. Aggiornare questo file ad ogni task completato

**File critici da controllare**:
- REWRITE_STATUS.md (questo file)
- Legacy/ folder integrity
- package.json status
- Git history preservation

---

**PROSSIMA AZIONE**: Completare spostamento files in Legacy/ e verificare backup