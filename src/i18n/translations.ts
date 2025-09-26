export interface Translation {
  // Homepage
  title: string
  subtitle: string
  version: string
  newGame: string
  pause: string
  resume: string
  instructions: string
  footerMadeBy: string
  footerControls: string

  // Game Start Overlay
  gameStartTitle: string
  gameStartSubtitle: string
  gameStartButton: string

  // Leaderboard
  leaderboard: string
  leaderboardTitle: string
  leaderboardWeekly: string
  leaderboardMonthly: string
  leaderboardLoading: string
  leaderboardEmpty: string
  leaderboardEncourage: string
  leaderboardInfo: string

  // Instructions
  instructionsTitle: string
  instructionsObjective: string
  instructionsControls: string
  instructionsRules: string
  instructionsTips: string
  instructionsGoodLuck: string
  instructionsArrowKeys: string
  instructionsMouseDrag: string
  instructionsMobileTouch: string
  instructionsBrownBottles: string
  instructionsGreenBottles: string
  instructionsStarPowerups: string
  instructionsLives: string
  instructionsTimer: string
  instructionsCatchStars: string
  instructionsAllGoodMode: string
  instructionsHighScore: string

  // Game UI
  score: string
  lives: string
  time: string
  allGood: string
  gameInstructions: string
  gameRules: string
  gameOver: string
  finalScore: string
  restartMessage: string

  // Auth Modal
  authWelcome: string
  authSignInToPlay: string
  authContinueGoogle: string
  authContinueEmail: string
  authEmailTitle: string
  authEmailSubtitle: string
  authSendCode: string
  authBack: string
  authVerifyTitle: string
  authVerifySubtitle: string
  authVerify: string
  authProfileTitle: string
  authProfileSubtitle: string
  authNicknamePlaceholder: string
  authMarketingConsent: string
  authStartPlaying: string
  authProcessing: string
  authEmailPlaceholder: string
  authOtpPlaceholder: string

  // Auth Messages
  authInvalidEmail: string
  authCodeSent: string
  authInvalidCode: string
  authCodeLength: string
  authFailed: string
  authUnexpectedError: string
  authGoogleFailed: string
  authSendFailed: string
  authVerifyFailed: string
  authProfileFailed: string


  // Character System
  footerControlsCharacter: string
  characterCharlie: string
  characterScrocca: string
  characterLeprecauno: string

  // Newsletter System
  newsletterTitle: string
  newsletterDescription: string
  newsletterEmailPlaceholder: string
  newsletterSubscribeButton: string
  newsletterUnsubscribeButton: string
  newsletterSuccessMessage: string
  newsletterErrorMessage: string
  newsletterAlreadySubscribed: string
  newsletterConsentText: string
  newsletterPrizeRequirement: string
  prizeLeaderboardTitle: string
  prizeEligibilityNote: string
  newsletterPermanentlyDeleted: string
}

export const translations = {
  en: {
    // Homepage
    title: 'Etimuè Bottle Dropper',
    subtitle: 'Catch the falling bottles!',
    version: 'v2.0.0 - Clean Architecture',
    newGame: 'New Game',
    pause: 'Pause',
    resume: 'Resume',
    instructions: 'Instructions',
    footerMadeBy: 'Made with ❤️ by Etimuè',
    footerControls: 'Use arrow keys or mouse to control {CHARACTER}!',

    // Game Start Overlay
    gameStartTitle: '🎮 Etimuè Bottle Dropper',
    gameStartSubtitle: 'Ready to catch some bottles?',
    gameStartButton: '▶️ New Game',

    // Leaderboard
    leaderboard: 'Leaderboard',
    leaderboardTitle: '🏆 Leaderboard',
    leaderboardWeekly: '📅 Weekly',
    leaderboardMonthly: '📆 Monthly',
    leaderboardLoading: 'Loading leaderboard...',
    leaderboardEmpty: 'No scores recorded yet!',
    leaderboardEncourage: 'Be the first to play and set the record!',
    leaderboardInfo: '💡 Sign in to compete for weekly and monthly prizes!',

    // Instructions
    instructionsTitle: '🎮 How to Play:',
    instructionsObjective: '🎯 Objective: Catch falling bottles with {CHARACTER}!',
    instructionsControls: '🕹️ Controls:',
    instructionsRules: '🍶 Game Rules:',
    instructionsTips: '🏆 Tips:',
    instructionsGoodLuck: 'Good luck! 🎮',
    instructionsArrowKeys: '• Use ← → arrow keys to move',
    instructionsMouseDrag: '• Or click and drag with mouse/touch',
    instructionsMobileTouch: '• On mobile: Use touch controls at bottom',
    instructionsBrownBottles: '• Brown bottles: +1 point each',
    instructionsGreenBottles: '• Green bottles: Lose 1 life (unless All Good mode)',
    instructionsStarPowerups: '• ⭐ Star power-ups: Activate All Good mode',
    instructionsLives: '• 💗 You have 3 lives',
    instructionsTimer: '• ⏰ 60 seconds to play',
    instructionsCatchStars: '• Catch star power-ups to avoid green bottle damage',
    instructionsAllGoodMode: '• All Good mode makes green bottles worth +1 point',
    instructionsHighScore: '• Try to get the highest score possible!',

    // Game UI
    score: 'Score',
    lives: 'Lives',
    time: 'Time',
    allGood: 'ALL GOOD',
    gameInstructions: 'Use arrow keys or drag to move {CHARACTER}!',
    gameRules: '🍶 Catch brown bottles: +1pt | 🟢 Avoid green bottles: -1 life | ⭐ Star: All Good!',
    gameOver: 'GAME OVER!',
    finalScore: 'Final Score',
    restartMessage: 'Click "New Game" to restart',

    // Auth Modal
    authWelcome: '🎮 Welcome to Etimuè Bottle Dropper!',
    authSignInToPlay: 'Sign in to play and compete for prizes',
    authContinueGoogle: 'Continue with Google',
    authContinueEmail: 'Continue with Email',
    authEmailTitle: '📧 Sign in with Email',
    authEmailSubtitle: "We'll send you a verification code",
    authSendCode: 'Send Code',
    authBack: '← Back',
    authVerifyTitle: '🔐 Enter Verification Code',
    authVerifySubtitle: 'Check your email for the 6-digit code',
    authVerify: 'Verify',
    authProfileTitle: '👤 Setup Your Profile',
    authProfileSubtitle: 'Choose a nickname for the leaderboard',
    authNicknamePlaceholder: 'Your nickname',
    authMarketingConsent: 'I want to receive updates and compete for prizes',
    authStartPlaying: 'Start Playing!',
    authProcessing: 'Processing...',
    authEmailPlaceholder: 'your@email.com',
    authOtpPlaceholder: '000000',

    // Auth Messages
    authInvalidEmail: 'Please enter a valid email address',
    authCodeSent: 'Verification code sent to your email!',
    authInvalidCode: 'Invalid verification code',
    authCodeLength: 'Please enter the 6-digit verification code',
    authFailed: 'Authentication failed, please try again',
    authUnexpectedError: 'Unexpected error during authentication',
    authGoogleFailed: 'Google sign in failed',
    authSendFailed: 'Failed to send verification code',
    authVerifyFailed: 'Unexpected error during verification',
    authProfileFailed: 'Failed to update profile',


    // Character System
    footerControlsCharacter: 'Use arrow keys or mouse to control {character}',
    characterCharlie: 'Charlie',
    characterScrocca: 'Scrocca',
    characterLeprecauno: 'Leprechaun',

    // Newsletter System
    newsletterTitle: 'Stay Updated!',
    newsletterDescription: 'Subscribe to our newsletter for game updates, events, and special offers from Etimuè pub!',
    newsletterEmailPlaceholder: 'Enter your email address',
    newsletterSubscribeButton: 'Subscribe to Newsletter',
    newsletterUnsubscribeButton: 'Unsubscribe',
    newsletterSuccessMessage: 'Successfully subscribed to our newsletter!',
    newsletterErrorMessage: 'Failed to subscribe. Please try again.',
    newsletterAlreadySubscribed: 'You are already subscribed to our newsletter!',
    newsletterConsentText: 'I agree to receive marketing communications from Etimuè',
    newsletterPrizeRequirement: '🏆 Subscribe to newsletter to be eligible for weekly and monthly prizes!',
    prizeLeaderboardTitle: '🏆 Prize Leaderboard (Newsletter Subscribers Only)',
    prizeEligibilityNote: 'Only newsletter subscribers are eligible for prizes',
    newsletterPermanentlyDeleted: 'This email was previously unsubscribed and cannot be re-added automatically. Please contact support or use a different email address.'
  } as Translation,

  it: {
    // Homepage
    title: 'Etimuè Bottle Dropper',
    subtitle: 'Prendi le bottiglie che cadono!',
    version: 'v2.0.0 - Architettura Pulita',
    newGame: 'Nuova Partita',
    pause: 'Pausa',
    resume: 'Riprendi',
    instructions: 'Istruzioni',
    footerMadeBy: 'Fatto con ❤️ da Etimuè',
    footerControls: 'Usa le frecce o il mouse per controllare {CHARACTER}!',

    // Game Start Overlay
    gameStartTitle: '🎮 Etimuè Bottle Dropper',
    gameStartSubtitle: 'Pronto per catturare le bottiglie?',
    gameStartButton: '▶️ Nuova Partita',

    // Leaderboard
    leaderboard: 'Classifica',
    leaderboardTitle: '🏆 Classifica',
    leaderboardWeekly: '📅 Settimanale',
    leaderboardMonthly: '📆 Mensile',
    leaderboardLoading: 'Caricamento classifica...',
    leaderboardEmpty: 'Nessun punteggio ancora registrato!',
    leaderboardEncourage: 'Sii il primo a giocare e stabilire il record!',
    leaderboardInfo: '💡 Accedi per competere per i premi settimanali e mensili!',

    // Instructions
    instructionsTitle: '🎮 Come Giocare:',
    instructionsObjective: '🎯 Obiettivo: Prendi le bottiglie che cadono con {CHARACTER}!',
    instructionsControls: '🕹️ Controlli:',
    instructionsRules: '🍶 Regole del Gioco:',
    instructionsTips: '🏆 Suggerimenti:',
    instructionsGoodLuck: 'Buona fortuna! 🎮',
    instructionsArrowKeys: '• Usa le frecce ← → per muoverti',
    instructionsMouseDrag: '• Oppure clicca e trascina con mouse/touch',
    instructionsMobileTouch: '• Su mobile: Usa i controlli touch in basso',
    instructionsBrownBottles: '• Bottiglie marroni: +1 punto ciascuna',
    instructionsGreenBottles: '• Bottiglie verdi: Perdi 1 vita (tranne in modalità All Good)',
    instructionsStarPowerups: '• ⭐ Power-up stella: Attiva modalità All Good',
    instructionsLives: '• 💗 Hai 3 vite',
    instructionsTimer: '• ⏰ 60 secondi per giocare',
    instructionsCatchStars: '• Prendi i power-up stella per evitare danni dalle bottiglie verdi',
    instructionsAllGoodMode: '• La modalità All Good rende le bottiglie verdi del valore di +1 punto',
    instructionsHighScore: '• Cerca di ottenere il punteggio più alto possibile!',

    // Game UI
    score: 'Punteggio',
    lives: 'Vite',
    time: 'Tempo',
    allGood: 'ALL GOOD',
    gameInstructions: 'Usa le frecce o trascina per muovere {CHARACTER}!',
    gameRules: '🍶 Prendi bottiglie marroni: +1pt | 🟢 Evita bottiglie verdi: -1 vita | ⭐ Stella: All Good!',
    gameOver: 'GAME OVER!',
    finalScore: 'Punteggio Finale',
    restartMessage: 'Clicca "Nuova Partita" per ricominciare',

    // Auth Modal
    authWelcome: '🎮 Benvenuto su Etimuè Bottle Dropper!',
    authSignInToPlay: 'Accedi per giocare e competere per i premi',
    authContinueGoogle: 'Continua con Google',
    authContinueEmail: 'Continua con Email',
    authEmailTitle: '📧 Accedi con Email',
    authEmailSubtitle: 'Ti invieremo un codice di verifica',
    authSendCode: 'Invia Codice',
    authBack: '← Indietro',
    authVerifyTitle: '🔐 Inserisci Codice di Verifica',
    authVerifySubtitle: 'Controlla la tua email per il codice a 6 cifre',
    authVerify: 'Verifica',
    authProfileTitle: '👤 Configura il Tuo Profilo',
    authProfileSubtitle: 'Scegli un nickname per la classifica',
    authNicknamePlaceholder: 'Il tuo nickname',
    authMarketingConsent: 'Voglio ricevere aggiornamenti e competere per i premi',
    authStartPlaying: 'Inizia a Giocare!',
    authProcessing: 'Elaborazione...',
    authEmailPlaceholder: 'tua@email.com',
    authOtpPlaceholder: '000000',

    // Auth Messages
    authInvalidEmail: 'Inserisci un indirizzo email valido',
    authCodeSent: 'Codice di verifica inviato alla tua email!',
    authInvalidCode: 'Codice di verifica non valido',
    authCodeLength: 'Inserisci il codice di verifica a 6 cifre',
    authFailed: 'Autenticazione fallita, riprova',
    authUnexpectedError: 'Errore imprevisto durante l\'autenticazione',
    authGoogleFailed: 'Accesso con Google fallito',
    authSendFailed: 'Invio del codice di verifica fallito',
    authVerifyFailed: 'Errore imprevisto durante la verifica',
    authProfileFailed: 'Aggiornamento del profilo fallito',


    // Character System
    footerControlsCharacter: 'Usa le frecce o il mouse per controllare {character}',
    characterCharlie: 'Charlie',
    characterScrocca: 'Scrocca',
    characterLeprecauno: 'Leprecauno',

    // Newsletter System
    newsletterTitle: 'Resta Aggiornato!',
    newsletterDescription: 'Iscriviti alla nostra newsletter per aggiornamenti del gioco, eventi e offerte speciali dal pub Etimuè!',
    newsletterEmailPlaceholder: 'Inserisci la tua email',
    newsletterSubscribeButton: 'Iscriviti alla Newsletter',
    newsletterUnsubscribeButton: 'Disiscriviti',
    newsletterSuccessMessage: 'Iscrizione alla newsletter completata con successo!',
    newsletterErrorMessage: 'Errore nell\'iscrizione. Riprova più tardi.',
    newsletterAlreadySubscribed: 'Sei già iscritto alla nostra newsletter!',
    newsletterConsentText: 'Acconsento a ricevere comunicazioni marketing da Etimuè',
    newsletterPrizeRequirement: '🏆 Iscriviti alla newsletter per partecipare ai premi settimanali e mensili!',
    prizeLeaderboardTitle: '🏆 Classifica Premi (Solo Iscritti Newsletter)',
    prizeEligibilityNote: 'Solo gli iscritti alla newsletter possono vincere i premi',
    newsletterPermanentlyDeleted: 'Questa email è stata precedentemente cancellata e non può essere riaggiunta automaticamente. Contatta il supporto o usa un indirizzo email diverso.'
  } as Translation
}

export type Language = keyof typeof translations