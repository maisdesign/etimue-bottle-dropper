import Phaser from 'phaser'
import { i18n } from '@/i18n'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    console.log('🥾 BootScene preload started')
    // Create loading bar
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    
    const progressBar = this.add.graphics()
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x222222, 0.8)
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50)
    
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    })
    loadingText.setOrigin(0.5, 0.5)
    
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2,
      text: '0%',
      style: {
        font: '18px monospace',
        color: '#ffffff'
      }
    })
    percentText.setOrigin(0.5, 0.5)
    
    // Update loading bar
    this.load.on('progress', (value: number) => {
      progressBar.clear()
      progressBar.fillStyle(0x28a745, 1)
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30)
      percentText.setText(`${Math.round(value * 100)}%`)
    })
    
    this.load.on('complete', () => {
      progressBar.destroy()
      progressBox.destroy()
      loadingText.destroy()
      percentText.destroy()
    })

    // Load essential assets for preload scene
    // Try to load Charlie image for boot screen
    this.load.image('boot_charlie', '/characters/charlie.png')
    this.load.on('filecomplete-image-boot_charlie', () => {
      console.log('✅ Loaded Charlie for boot screen')
    })
    
    this.load.on('loaderror', (fileObj: any) => {
      if (fileObj.key === 'boot_charlie') {
        console.warn('❌ Failed to load charlie.png for boot, using SVG logo fallback')
        // Create fallback logo as before
        this.load.image('logo', 'data:image/svg+xml;base64,' + btoa(`
          <svg width="200" height="100" xmlns="http://www.w3.org/2000/svg">
            <rect width="200" height="100" fill="#87CEEB"/>
            <text x="100" y="35" font-family="Arial, sans-serif" font-size="16" font-weight="bold" text-anchor="middle" fill="#333">
              Etimuè
            </text>
            <text x="100" y="65" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="#333">
              Bottle Dropper
            </text>
          </svg>
        `))
      }
    })

    // Check PWA installability
    this.checkPWAInstallability()
  }

  private checkPWAInstallability() {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('App is running in standalone mode (PWA)')
    }

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA installable')
      // Store the event so it can be triggered later
      ;(window as any).deferredPrompt = e
    })

    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      console.log('Service worker supported')
    }
  }

  create() {
    console.log('🥾 BootScene create started')
    // Set up initial game state
    this.registry.set('gameSettings', {
      audioEnabled: localStorage.getItem('audio-enabled') === 'true',
      language: i18n.getCurrentLanguage(),
      firstTime: !localStorage.getItem('game-played-before')
    })

    // Initialize analytics consent
    const analyticsConsent = localStorage.getItem('analytics-consent')
    this.registry.set('analyticsConsent', analyticsConsent === 'true')

    // Show title briefly then go to preload
    // Use Charlie if available, otherwise use logo
    const imageKey = this.textures.exists('boot_charlie') ? 'boot_charlie' : 'logo'
    const bootImage = this.add.image(this.cameras.main.centerX, this.cameras.main.centerY - 50, imageKey)
      .setOrigin(0.5)
    
    // If using Charlie, scale it appropriately for boot screen
    if (imageKey === 'boot_charlie') {
      bootImage.setScale(0.3) // Scale down Charlie to fit boot screen
    }

    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 50, 
      i18n.getCurrentLanguage() === 'it' ? 'Inizializzazione...' : 'Initializing...', {
      fontSize: '16px',
      color: '#333333'
    }).setOrigin(0.5)

    // Transition to PreloadScene after a brief delay
    this.time.delayedCall(1500, () => {
      console.log('🥾 BootScene transitioning to PreloadScene')
      this.scene.start('PreloadScene')
    })
  }
}