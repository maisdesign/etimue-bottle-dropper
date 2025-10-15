# TODO - Etimuè Bottle Dropper

## 🚀 TODO - PROSSIMA SESSIONE (Priorità Alta)

### 🦘 Salto - Ottimizzazione Velocità
- [ ] **Velocizzare il salto** - Attualmente la parabola è troppo lenta
  - Valutare aumento gravità (da 800 a 1000-1200?)
  - Oppure ridurre ulteriormente jumpVelocity mantenendo stessa altezza
  - Obiettivo: salto più rapido e reattivo, meno "fluttuante"

### 📦 Hitbox Personaggio - Verifica Dimensioni
- [ ] **Controllare dimensione hitbox** - Sospetta troppo larga
  - Altezza dovrebbe andare bene
  - **Larghezza potrebbe essere eccessiva** - controllare collisioni
  - Testare con bottiglie che passano vicino al personaggio
  - File da verificare: `GameScene.ts` (setSize o setBodySize)
  - Considerare hitbox più piccola del sprite visuale per gameplay più fair

### 🕹️ UX Controlli - Salto nella Swipe Bar
- [ ] **VALUTARE: Eliminare pulsanti + salto nella swipe bar**
  - **PRO eliminazione pulsanti:**
    - Interfaccia più pulita
    - Meno ingombro visivo
    - Una sola area di controllo = più intuitivo
    - Più spazio schermo per gameplay
  - **CONTRO eliminazione pulsanti:**
    - Perdita pulsanti T/M/U (placeholder per future feature?)
    - Meno separazione tra azioni (movimento vs salto)
  - **IMPLEMENTAZIONE PROPOSTA:**
    - Swipe laterale = movimento proporzionale (come ora)
    - **Tap veloce** sulla swipe bar = salto
    - Oppure **swipe verso l'alto** = salto
    - Oppure **doppio tap** = salto
  - **DA DECIDERE:** Quale gesture per il salto?
    - Tap: più semplice ma rischio salti accidentali
    - Swipe up: più intenzionale ma meno rapido
    - Doppio tap: medio ma potrebbe essere lento in emergenza

---

## ✅ COMPLETATO OGGI (15 Ottobre 2025)

### 🎮 MOVIMENTO INCREMENTALE PROPORZIONALE - Implementato!
- ✅ **Sistema swipe completamente ridisegnato** con velocità proporzionale
- ✅ **Centro swipe zone = FERMO** (velocità 0%)
- ✅ **Bordi swipe zone = VELOCE** (100% velocità)
- ✅ Formula: `velocità = distanza_dal_centro × velocità_base`
- ✅ Deadzone ridotta a 15% per massima precisione
- ✅ `moveDirection` ora valore continuo da -1.0 a +1.0
- ✅ Rimossa variabile `startX` inutilizzata (pulizia codice)
- ✅ **Commit**: fc8109e6 (dev) + 8e1075c (prod)

### 🦘 Salto - Fisica Corretta + Bilanciamento
- ✅ **Fix fisica salto**: Aggiunto controllo direzione velocità (isFalling)
- ✅ **Reset isJumping** solo quando player è a terra E sta cadendo
- ✅ **Parabola fluida**: Sale → Picco → Cade → Atterra
- ✅ **Altezza bilanciata**: -600 (era -900, troppo alto)
- ✅ **Commit**: dd155ab0 + f4773a8f (dev)

### 🍾 Bottiglie Laterali - Movimento Orizzontale Puro
- ✅ **Gravità disabilitata** per bottiglie laterali (`setAllowGravity(false)`)
- ✅ **Linea retta perfettamente orizzontale** da sx/dx
- ✅ **Spawn a livello player** (height - 80) per obbligare a saltare
- ✅ **Commit**: a2b372a7 + 5f4350f9 (dev)

### 🕹️ Swipe Zone - 100% Larghezza
- ✅ **Espansa da 70% a 100%** larghezza schermo
- ✅ **Più responsiva** su tutti i device
- ✅ **Altezza aumentata** a 140px per migliore usabilità
- ✅ **Commit**: 5f4350f9 (dev)

### ⏸️ Pulsante PAUSA - Implementato
- ✅ **Pulsante in alto a destra** durante il gioco
- ✅ **Toggle ⏸️ ↔️ ▶️** con overlay semi-trasparente
- ✅ **Physics.pause()/resume()** funzionale
- ✅ **Traduzioni IT/EN** complete
- ✅ **Commit**: a2b372a7 (dev)

---

### 🐛 BUG FIX - Bottiglie Laterali Invisibili RISOLTO
- ✅ **PROBLEMA**: Le bottiglie laterali non erano visibili (spawn da dx/sx non funzionava)
- ✅ **ROOT CAUSE**: `setCollideWorldBounds(true)` impediva alle bottiglie spawned a x=-50 o x=width+50 di entrare nello schermo
- ✅ **SOLUZIONE**: Cambiato `setCollideWorldBounds(false)` per permettere bottiglie di entrare/uscire liberamente dallo schermo
- ✅ **FILE MODIFICATO**: [GameScene.ts:432](src/scenes/GameScene.ts#L432)
- ✅ **TESTING**: Build OK, preview server attivo su localhost:4173
- 📝 **DA TESTARE**: Verificare visivamente su dispositivi reali dopo deploy

---

## ✅ COMPLETATO (14 Ottobre 2025)

### 🎨 UX Fix - Instructions Text Spacing
- ✅ **Posizione testo istruzioni**: Spostato da 12% a 9.5% altezza schermo
- ✅ **Motivo**: Migliore spacing, prevenzione overlap con altri elementi UI
- ✅ **Commit**: ffec5a73 (dev) + 66aff60 (prod)
- ✅ Deploy completato su Netlify

---

## ✅ COMPLETATO PRECEDENTEMENTE (12 Ottobre 2025)

### 🎮 Ottimizzazione Mobile Portrait + UX Improvements
- ✅ **Area di gioco estesa**: 600x1000px per mobile portrait (era 800x600)
- ✅ **Velocità aumentata**: Bottiglie +65% su schermi alti (330px/s vs 200px/s)
- ✅ **Pulsante NUOVA PARTITA**: Aggiunto in hamburger menu (in cima)
- ✅ **Pulsante NUOVA PARTITA**: Aggiunto in GameOver screen (verde, cliccabile, hover effect)
- ✅ **Sfondo Pub Irlandese**: Gradiente verde scuro + texture legno + trifogli decorativi + accenti oro
- ✅ **Detection mobile**: Automatic portrait mode detection (window.innerWidth < 768)
- ✅ **Speed adjustment**: Dynamic based on screen height
- ✅ Deploy completato su Netlify

### 🔧 Fix Fullscreen Mobile - Soluzione CSS-Based
- ✅ **PROBLEMA RISOLTO**: Fullscreen non copriva tutto lo schermo
- ✅ **APPROCCIO CORRETTO**: Soluzione CSS invece di resize canvas Phaser
- ✅ CSS `body.fullscreen-active` con !important per override completo
- ✅ Game container ridimensionato a 100vw/100vh (e 100dvw/100dvh)
- ✅ Nascosti header, controls, footer, newsletter in fullscreen
- ✅ Rimossi padding, margin, border, border-radius in fullscreen
- ✅ Event listeners fullscreenchange gestiscono toggle CSS class
- ✅ Deploy completato su Netlify
- ⚠️ **NOTA**: Primo tentativo fallito con game.scale.setGameSize() - peggiorava il problema

### 🎯 OAuth Verificato Funzionante
- ✅ Verificato screenshot console.txt - OAuth Google funziona
- ✅ Login/logout funzionanti
- ✅ Score submission OK (6 punti salvati dopo 49s)
- ✅ Leaderboard caricata correttamente (14 entries)

### 🔧 Fix Fullscreen Mobile - Soluzione CSS-Based
- ✅ **PROBLEMA RISOLTO**: Fullscreen non copriva tutto lo schermo
- ✅ **APPROCCIO CORRETTO**: Soluzione CSS invece di resize canvas Phaser
- ✅ CSS `body.fullscreen-active` con !important per override completo
- ✅ Game container ridimensionato a 100vw/100vh (e 100dvw/100dvh)
- ✅ Nascosti header, controls, footer, newsletter in fullscreen
- ✅ Rimossi padding, margin, border, border-radius in fullscreen
- ✅ Event listeners fullscreenchange gestiscono toggle CSS class
- ✅ Deploy completato su Netlify
- ⚠️ **NOTA**: Primo tentativo fallito con game.scale.setGameSize() - peggiorava il problema

### 🎯 OAuth Verificato Funzionante
- ✅ Verificato screenshot console.txt - OAuth Google funziona
- ✅ Login/logout funzionanti
- ✅ Score submission OK (6 punti salvati dopo 49s)
- ✅ Leaderboard caricata correttamente (14 entries)

---

## ✅ COMPLETATO (11 Ottobre 2025)

### 🍔 Hamburger Menu Implementation
- ✅ Creato menu hamburger slide-in da sinistra
- ✅ Spostati tutti i controlli secondari nel menu
- ✅ Homepage semplificata: solo 2 pulsanti principali
- ✅ Pause/resume automatico gioco con menu
- ✅ Milestone creata: `v2.2.0-pre-hamburger`

### 📱 Fullscreen Button per Mobile
- ✅ Creato pulsante fullscreen manuale
- ✅ Visibile solo su dispositivi mobili
- ✅ Toggle fullscreen on/off con cambio colore
- ✅ Supporto cross-browser (webkit/moz/ms/standard)

---

## 🚀 TODO - PRIORITÀ MASSIMA (Prossima Sessione)

### 🎮 MIGLIORAMENTI CONTROLLI ARCADE (v2.5.0)
**STATO**: Implementato ma necessita ottimizzazioni basate su feedback utente

#### 🦘 Sistema Salto - MIGLIORAMENTI RICHIESTI
- [ ] **INCREMENTARE ALTEZZA SALTO** - Attualmente salta troppo poco
  - Aumentare `jumpVelocity` (ora -400, provare -600 o -800)
  - Oppure ridurre `gravity` (ora 800, provare 600)
  - Testare su dispositivi mobili reali
  - Verificare che salti sopra bottiglie laterali facilmente

#### 🍾 Bottiglie Laterali - SPAWN BIDIREZIONALE
- [x] ~~Spawn da sinistra verso destra~~ ✅ IMPLEMENTATO (GameScene.ts:383-391)
- [x] ~~Spawn da destra verso sinistra~~ ✅ IMPLEMENTATO (GameScene.ts:383-391)
- [x] ~~Random 50/50 direzione laterale~~ ✅ IMPLEMENTATO
- [x] ~~🐛 **BUG RISOLTO**: Le bottiglie laterali non si vedono~~ ✅ FIXATO (15 Ott 2025)
- [x] ~~**DEBUG**: Verificare posizione spawn e velocità rendering~~ ✅ RISOLTO (setCollideWorldBounds issue)
- [ ] **Verificare bilanciamento difficoltà** spawn laterali su mobile reale
- [ ] **Testare velocità bottiglie laterali** (ora 60% delle verticali)
- [ ] Considerare visual warning prima dello spawn laterale
- 📝 **NOTA**: Sistema completamente funzionante, da testare su dispositivi reali

#### 🕹️ ALTERNATIVA CONTROLLI - SWIPE vs JOYSTICK
- [ ] **VALUTARE SISTEMA SWIPE** al posto del joystick
  - Zona touch in basso schermo per swipe dx/sx
  - Più intuitivo su mobile?
  - Testare entrambi e confrontare UX
  - Possibile switch nelle impostazioni?
- [ ] Implementare versione swipe come alternativa
- [ ] A/B testing con utenti reali
- [ ] Decidere quale sistema mantenere (o entrambi con toggle)

---

## 🔧 TODO - PROSSIME SESSIONI

### 📱 Test e Ottimizzazioni Mobile
- [ ] Testare hamburger menu su dispositivi Android reali
- [ ] Testare hamburger menu su iPhone/iPad reali
- [ ] Testare funzionalità fullscreen su vari browser mobile
- [ ] Verificare touch controls durante fullscreen
- [ ] Testare pause/resume gioco con hamburger menu
- [ ] Valutare se implementare auto full screen su mobile

### 🎵 Audio System (Placeholder Attivo)
- [ ] Implementare sistema audio del gioco
- [ ] Aggiungere effetti sonori per:
  - Bottiglia catturata
  - Bottiglia persa
  - Power-up stella
  - Game over
  - Countdown
- [ ] Aggiungere musica di sottofondo
- [ ] Collegare toggle audio nel menu hamburger
- [ ] Salvare preferenza audio in localStorage

### 🏆 Modale Premi (Attualmente Alert)
- [ ] Creare modale dedicata per "Cosa si vince"
- [ ] Design accattivante con premi visualizzati
- [ ] Immagini dei premi (discount cards, etc.)
- [ ] Spiegazione dettagliata regole vincita
- [ ] Link per iscriversi alla newsletter
- [ ] Sostituire alert() con modale vera

### 📄 Pagine Privacy e Termini
- [ ] Creare pagina Privacy policy dedicata
- [ ] Creare pagina Termini e condizioni
- [ ] Hosting su www.etimue.it o creare pagine statiche
- [ ] Aggiornare link nel menu hamburger
- [ ] Assicurare conformità GDPR

### 🎨 Miglioramenti UI/UX
- [ ] Aggiungere animazioni ai pulsanti principali
- [ ] Migliorare feedback visivo touch controls
- [ ] Ottimizzare dimensioni font per mobile
- [ ] Testare accessibilità (screen readers, etc.)
- [ ] Aggiungere loading states più chiari

### 🔐 Sistema Autenticazione
- [x] ~~Verificare funzionamento OAuth Google in produzione~~ ✅ VERIFICATO - Funziona
- [ ] Testare flow di login/logout completo
- [ ] Verificare persistenza sessione
- [ ] Testare cambio nickname
- [ ] Verificare visibilità logout button nel menu

### 🏅 Sistema Leaderboard
- [ ] Testare caricamento leaderboard su mobile
- [ ] Verificare performance con molti utenti
- [ ] Ottimizzare query database se necessario
- [ ] Aggiungere paginazione se necessario
- [ ] Testare filtri settimanali/mensili

### 📧 Newsletter Integration
- [ ] Testare iscrizione newsletter completa
- [ ] Verificare email di conferma Mailchimp
- [ ] Testare verifica iscrizione esistente
- [ ] Controllare sincronizzazione con Supabase
- [ ] Verificare requisiti premi

### 🐱 Sistema Personaggi
- [ ] Testare cambio personaggio durante il gioco
- [ ] Verificare persistenza selezione personaggio
- [ ] Ottimizzare caricamento sprite
- [ ] Assicurare tutti i personaggi funzionino correttamente
- [ ] Testare traduzioni nomi personaggi

### 🎮 Gameplay Improvements
- [ ] Bilanciare difficoltà (velocità bottiglie)
- [ ] Testare sistema vite e All Good mode
- [ ] Verificare scoring system equo
- [ ] Anti-cheat: verificare validazione lato server
- [ ] Ottimizzare performance gioco mobile

### 📊 Analytics e Monitoring
- [ ] Aggiungere Google Analytics o alternativa
- [ ] Monitorare errori JavaScript in produzione
- [ ] Tracciare conversioni (login, newsletter, etc.)
- [ ] Verificare performance (Lighthouse scores)
- [ ] Monitorare utilizzo mobile vs desktop

### 🛠️ Technical Debt
- [ ] Ridurre dimensione bundle (1.6MB è grande)
- [ ] Implementare code splitting
- [ ] Ottimizzare immagini e asset
- [ ] Migliorare caching strategy
- [ ] Aggiornare dipendenze vulnerabili

---

## 🚨 ISSUE NOTI

### ⚠️ Da Verificare
1. ~~**OAuth Domain**~~: ✅ FUNZIONANTE - Verificato da console.txt
2. **Service Worker**: PWA disabilitato per debug - valutare se riabilitare
3. **Bundle Size**: Warning Vite per chunk > 500kb (1.68MB attualmente)

### 📝 Note Tecniche
- Repository development: `etimue-bottle-dropper`
- Repository production (Netlify): `bottledropper2`
- Usare sempre `./deploy.sh` per deployment
- Milestone di rollback: `v2.2.0-pre-hamburger`

---

## 📚 DOCUMENTAZIONE

### File Chiave
- **CLAUDE.md**: Documentazione principale progetto
- **deploy.sh**: Script automatico deployment
- **src/ui/GlobalFunctions.ts**: Logica UI principale
- **src/i18n/translations.ts**: Traduzioni IT/EN

### Comandi Utili
```bash
npm run dev          # Development server
npm run build        # Build production
npm run preview      # Preview build locale
./deploy.sh          # Deploy su Netlify
```

### Link Importanti
- Live Site: https://etimuebottledropper.netlify.app/
- Supabase: https://xtpfssiraytzvdvgrsol.supabase.co
- GitHub Dev: https://github.com/maisdesign/etimue-bottle-dropper
- GitHub Prod: https://github.com/maisdesign/bottledropper2

---

## 💡 IDEE FUTURE

### Possibili Feature
- [ ] Modalità multiplayer/competizione in tempo reale
- [ ] Power-ups aggiuntivi (slow-motion, magnet, etc.)
- [ ] Skin alternative per personaggi
- [ ] Achievements/trofei
- [ ] Condivisione punteggi sui social
- [ ] Statistiche personali dettagliate
- [ ] Tornei settimanali con premi speciali
- [ ] Tutorial interattivo per nuovi giocatori
- [ ] Replay delle partite migliori

---

**Ultimo aggiornamento**: 15 Ottobre 2025
**Versione corrente**: v2.5.0 - Arcade Controls
**Stato**: ✅ Deployato - In attesa feedback utente per ottimizzazioni
**Commit**: 67a4e9ac (dev) + 9911a38 (prod)
**Prossimi obiettivi**:
1. 🦘 Aumentare altezza salto (troppo basso)
2. 🐛 Fixare visibilità bottiglie laterali (codice implementato ma non si vedono)
3. 🕹️ Valutare sistema swipe come alternativa al joystick

---

## ✅ COMPLETATO OGGI (14 Ottobre 2025 - Sera)

### 🎮 ARCADE CONTROLS - Implementazione Completa
**OBIETTIVO RAGGIUNTO**: Sistema controlli arcade completamente funzionante!

#### ✅ Joystick Virtuale Stile Xbox (Sinistra)
- ✅ **Joystick circolare** con base trasparente + stick verde
- ✅ **Touch e drag** per movimento fluido
- ✅ **Dead zone 20%** per prevenire micro-movimenti
- ✅ **Visual feedback** con transform CSS
- ✅ **Cross-browser** con fallback mouse per testing desktop
- ✅ **Posizione**: 30px dal basso-sinistra, 120px diametro

#### ✅ Pulsanti ETMU 2x2 (Destra)
- ✅ **Layout 2x2** con E in alto-destra (salto attivo)
- ✅ **Design arcade**: circolari 60px, verde per attivi (#64A834)
- ✅ **T/M/U placeholder**: semi-trasparenti, non cliccabili
- ✅ **Touch feedback**: scale 0.9 al press
- ✅ **Posizione**: 30px dal basso-destra, gap 15px

#### ✅ Sistema Salto con Fisica
- ✅ **Gravità Phaser**: 800px/s² verso il basso
- ✅ **Jump velocity**: -400px/s (verso l'alto)
- ✅ **Altezza salto**: ~150px (perfetto per bottiglie laterali)
- ✅ **Ground detection**: tolleranza 5px per floating point
- ✅ **Reset automatico**: isJumping flag quando atterra
- ✅ **Type safety**: Cast Body per evitare errori TypeScript

#### ✅ Bottiglie Laterali
- ✅ **Spawn split**: 70% dall'alto, 30% da lati (15% dx, 15% sx)
- ✅ **Traiettoria orizzontale**: solo velocityX, no velocityY
- ✅ **Velocità ridotta**: 60% della velocità verticale
- ✅ **Altezza spawn**: tra 30% e 70% dello schermo
- ✅ **Exit detection**: cleanup quando escono dallo schermo (-100px/+100px)
- ✅ **Progressive difficulty**: stesso sistema delle verticali

#### ✅ Cleanup UI Vecchi Controlli
- ✅ **HTML**: Rimosso `.mobile-controls` da index.html
- ✅ **CSS**: Rimossi 3 blocchi CSS per touch-btn (linee 509-772)
- ✅ **JavaScript**: Rimossi event listeners da GlobalFunctions.ts
- ✅ **Commenti**: Aggiunti commenti esplicativi per documentazione

#### ✅ Traduzioni Aggiornate
- ✅ **Inglese**: "On mobile: Joystick (left) + E button (right) to jump"
- ✅ **Italiano**: "Su mobile: Joystick (sinistra) + pulsante E (destra) per saltare"
- ✅ **Instructions modal**: Aggiornato per riflettere nuovi controlli

#### ✅ Architettura e Integrazione
- ✅ **VirtualControls.ts**: Nuovo componente modulare e riusabile
- ✅ **GameScene integration**: Setup in create(), show in startGame(), hide in endGame()
- ✅ **Cleanup automatico**: destroy() su shutdown
- ✅ **Callbacks**: onJoystickMove, onButtonPress, onButtonRelease
- ✅ **State management**: getJoystickState(), getButtonState()

#### ✅ Build e Deploy
- ✅ **Build production**: ✓ Compilato senza errori (1.69MB)
- ✅ **TypeScript fixes**: Cast Body per metodi Phaser
- ✅ **Testing locale**: Preview server su localhost:4173
- ✅ **Git commit**: Messaggio dettagliato con emoji
- ✅ **Deploy Netlify**: Completato su bottledropper2 (commit 9911a38)
- ✅ **Live site**: https://etimuebottledropper.netlify.app/ aggiornato

### 📊 Statistiche Implementazione
- **Files creati**: 1 (VirtualControls.ts)
- **Files modificati**: 8 (GameScene.ts, GlobalFunctions.ts, index.html, styles.css, translations.ts, ecc.)
- **Linee aggiunte**: ~778
- **Linee rimosse**: ~310
- **Tempo implementazione**: ~3 ore
- **Bugs trovati durante build**: 5 (tutti fixati)

### 🎯 Features Pronte per Testing
- [x] Joystick funziona su mobile/desktop
- [x] Pulsante E salto funziona
- [x] Bottiglie spawn da 3 direzioni (alto, dx, sx)
- [x] Fisica salto realistico
- [x] Traduzioni complete IT/EN
- [x] Cleanup completo vecchi controlli
- [x] Build production OK
- [x] Deploy Netlify OK

### ⚠️ Da Testare su Dispositivi Reali
- [ ] **Touch responsiveness** joystick su Android
- [ ] **Touch responsiveness** joystick su iOS
- [ ] **Pulsante E salto** su Android
- [ ] **Pulsante E salto** su iOS
- [ ] **Bilanciamento bottiglie laterali** (troppo facili/difficili?)
- [ ] **Altezza salto** adeguata per evitare bottiglie
- [ ] **Performance** con controlli virtuali attivi
- [ ] **Layout responsive** su schermi piccoli (<375px)

---
