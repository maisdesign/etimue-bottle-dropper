# TODO - Etimuè Bottle Dropper

## ✅ COMPLETATO OGGI (11 Ottobre 2025)

### 🍔 Hamburger Menu Implementation
- ✅ Creato menu hamburger slide-in da sinistra
- ✅ Spostati tutti i controlli secondari nel menu:
  - ❓ Istruzioni
  - 🏆 Premi (Cosa si vince)
  - 🏅 Classifica
  - 🔊 Audio toggle (placeholder)
  - 🌍 Cambio lingua (IT/EN)
  - 🔐 Privacy
  - 📜 Termini
  - 🚪 Logout (solo per utenti autenticati)
- ✅ Homepage semplificata: solo 2 pulsanti principali (GIOCA + Selezione Personaggio)
- ✅ Animazioni CSS fluide e transizioni
- ✅ Click fuori dal menu per chiuderlo
- ✅ Milestone creata: `v2.2.0-pre-hamburger`

### 🐛 Fix UX Hamburger Menu
- ✅ Fix posizione desktop: centrato verticalmente invece che in alto a sinistra
- ✅ Fix posizione mobile: non copre più il titolo, dimensioni ridotte
- ✅ Pause automatica del gioco quando si apre il menu
- ✅ Resume automatico quando si chiude il menu
- ✅ Responsive sizing (45px tablet, 42px phone)

### 📱 Fullscreen per Mobile
- ✅ Creato pulsante fullscreen manuale
- ✅ Visibile solo su dispositivi mobili (user agent detection)
- ✅ Toggle fullscreen on/off con click
- ✅ Cambio colore: verde (inattivo) → arancione (attivo)
- ✅ Supporto cross-browser (webkit/moz/ms/standard)
- ✅ Traduzioni IT/EN complete
- ✅ Event listeners per fullscreenchange

### 🚀 Deployment
- ✅ Tutti i fix deployati su Netlify
- ✅ Live su: https://etimuebottledropper.netlify.app/
- ✅ Versione: v2.3.1 - Hamburger Menu

---

## 🔧 TODO - PROSSIME SESSIONI

### 📱 Test e Ottimizzazioni Mobile
- [ ] Testare hamburger menu su dispositivi Android reali
- [ ] Testare hamburger menu su iPhone/iPad reali
- [ ] Testare funzionalità fullscreen su vari browser mobile
- [ ] Verificare touch controls durante fullscreen
- [ ] Testare pause/resume gioco con hamburger menu

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
- [ ] Verificare funzionamento OAuth Google in produzione
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
1. **OAuth Domain**: Verificare se Google Cloud Console ha ancora il vecchio dominio
2. **Service Worker**: PWA disabilitato per debug - valutare se riabilitare
3. **Bundle Size**: Warning Vite per chunk > 500kb

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

**Ultimo aggiornamento**: 11 Ottobre 2025
**Versione corrente**: v2.3.1 - Hamburger Menu
**Stato**: ✅ Tutto funzionante e deployato
