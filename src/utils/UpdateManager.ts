import { t } from '@/i18n'

export class UpdateManager {
  private updateBanner: HTMLElement | null = null
  
  constructor() {
    this.setupUpdateListener()
  }
  
  private setupUpdateListener() {
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service worker updated, page will reload automatically')
        // The new service worker has taken control, reload to get fresh content
        window.location.reload()
      })
      
      // Listen for waiting service worker
      navigator.serviceWorker.ready.then(registration => {
        if (registration.waiting) {
          this.showUpdatePrompt()
        }
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdatePrompt()
              }
            })
          }
        })
      })
    }
  }
  
  private showUpdatePrompt() {
    if (this.updateBanner) return // Already showing
    
    this.createUpdateBanner()
  }
  
  private createUpdateBanner() {
    // Create banner element
    this.updateBanner = document.createElement('div')
    this.updateBanner.id = 'update-banner'
    this.updateBanner.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #28a745, #20c997);
        color: white;
        padding: 16px;
        text-align: center;
        z-index: 10001;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        animation: slideDown 0.3s ease;
      ">
        <div style="max-width: 600px; margin: 0 auto;">
          <strong>🚀 ${t('update.available')}</strong>
          <p style="margin: 8px 0; font-size: 14px;">${t('update.description')}</p>
          <button id="update-now" style="
            background: rgba(255,255,255,0.2);
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            margin-right: 10px;
            font-weight: 600;
          ">
            ${t('update.updateNow')}
          </button>
          <button id="update-later" style="
            background: transparent;
            border: 1px solid rgba(255,255,255,0.3);
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
          ">
            ${t('update.later')}
          </button>
        </div>
      </div>
      
      <style>
        @keyframes slideDown {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      </style>
    `
    
    document.body.appendChild(this.updateBanner)
    
    // Add event listeners
    const updateNowBtn = this.updateBanner.querySelector('#update-now')
    const updateLaterBtn = this.updateBanner.querySelector('#update-later')
    
    updateNowBtn?.addEventListener('click', () => this.applyUpdate())
    updateLaterBtn?.addEventListener('click', () => this.dismissBanner())
  }
  
  private async applyUpdate() {
    console.log('🔄 Applying service worker update...')
    
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        
        if (registration.waiting) {
          // Tell the waiting service worker to skip waiting and become active
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      }
      
      // Clear all caches to ensure fresh content
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }
      
      // Show loading message
      if (this.updateBanner) {
        this.updateBanner.innerHTML = `
          <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #007bff;
            color: white;
            padding: 16px;
            text-align: center;
            z-index: 10001;
          ">
            <strong>🔄 ${t('update.updating')}...</strong>
          </div>
        `
      }
      
      // Reload after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)
      
    } catch (error) {
      console.error('❌ Update failed:', error)
      this.dismissBanner()
    }
  }
  
  private dismissBanner() {
    if (this.updateBanner) {
      this.updateBanner.style.animation = 'slideUp 0.3s ease'
      this.updateBanner.style.transform = 'translateY(-100%)'
      
      setTimeout(() => {
        this.updateBanner?.remove()
        this.updateBanner = null
      }, 300)
    }
  }
  
  // Manual cache clearing function
  public async clearCache(): Promise<void> {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
        console.log('✅ All caches cleared')
      }
      
      // Unregister service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        await Promise.all(registrations.map(registration => registration.unregister()))
        console.log('✅ Service worker unregistered')
      }
      
    } catch (error) {
      console.error('❌ Cache clearing failed:', error)
      throw error
    }
  }
}

// Global instance
export const updateManager = new UpdateManager()