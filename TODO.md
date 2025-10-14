# TODO - Etimuè Bottle Dropper

## ✅ COMPLETATO OGGI (14 Ottobre 2025)

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

### 🎮 NUOVI CONTROLLI DI GIOCO
**OBIETTIVO**: Trasformare controlli touch in sistema più intuitivo tipo arcade

#### 🕹️ Analogico Virtuale (Sinistra)
- [ ] **Implementare joystick virtuale** a sinistra dello schermo
- [ ] Design circolare con stick centrale trascinabile
- [ ] Movimento personaggio basato su direzione stick (sinistra/destra)
- [ ] Visual feedback per touch (evidenziare quando attivo)
- [ ] Dead zone centrale per prevenire input accidentali
- [ ] Smooth movement interpolation

#### 🎯 Pulsanti ETMU (Destra)
- [ ] **Sostituire controlli touch attuali** con 4 pulsanti fissi
- [ ] **Layout pulsanti**: Disposizione verticale a destra
  - **E** (in alto) - SALTO
  - **T** (centro-alto)
  - **M** (centro-basso)
  - **U** (in basso)
- [ ] Design pulsanti stile arcade (circolari, colorati)
- [ ] Feedback visivo al tocco (press animation)
- [ ] Posizionamento ergonomico per pollice destro

#### 🦘 Sistema Salto
- [ ] **Implementare meccanica salto** collegata a pulsante E
- [ ] Fisica salto realistica (gravity, jump force)
- [ ] Animazione salto personaggio
- [ ] Cooldown salto (prevenire spam infinito)
- [ ] Salto utile per evitare bottiglie pericolose
- [ ] Integrazione con sistema vite/scoring

#### 🍾 Bottiglie Laterali
- [ ] **Spawn bottiglie da lati destro/sinistro**
- [ ] Traiettoria orizzontale → verso centro schermo
- [ ] Mix spawn: dall'alto + dai lati (varietà gameplay)
- [ ] Velocità laterale proporzionale a difficoltà
- [ ] Visual warning quando bottiglia sta per apparire dal lato
- [ ] Bilanciamento spawn rate (non troppo caotico)

#### 🎨 UI/UX Nuovi Controlli
- [ ] Rimuovere frecce sinistra/destra attuali
- [ ] Tutorial overlay per spiegare nuovi controlli
- [ ] Traduzioni IT/EN per istruzioni nuovi controlli
- [ ] Testing touch responsiveness su vari dispositivi
- [ ] Ottimizzazione layout per schermi piccoli/grandi

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

**Ultimo aggiornamento**: 14 Ottobre 2025
**Versione corrente**: v2.4.1 - Instructions Spacing Fix
**Stato**: ✅ Tutto funzionante e deployato
**Commit**: ffec5a73 (dev) + 66aff60 (prod)
**Prossimo obiettivo**: 🎮 Implementazione nuovi controlli (analogico + pulsanti ETMU + salto + bottiglie laterali)
