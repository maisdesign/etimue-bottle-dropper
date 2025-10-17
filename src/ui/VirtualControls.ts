/**
 * VirtualControls.ts
 *
 * Sistema di controlli virtuali per mobile arcade-style:
 * - Joystick virtuale (sinistra) - Movimento orizzontale
 * - 4 pulsanti ETMU 2x2 (destra) - E=salto, T/M/U=placeholder
 */

export interface JoystickState {
  active: boolean
  angle: number
  distance: number
  direction: { x: number; y: number }
}

export interface ButtonState {
  E: boolean // Salto
  T: boolean // Placeholder
  M: boolean // Placeholder
  U: boolean // Placeholder
}

export class VirtualControls {
  private container: HTMLDivElement
  private joystickContainer: HTMLDivElement
  private joystickBase: HTMLDivElement
  private joystickStick: HTMLDivElement
  private buttonsContainer: HTMLDivElement
  private buttons: Map<string, HTMLButtonElement>

  private joystickState: JoystickState
  private buttonState: ButtonState

  private joystickTouchId: number | null = null

  // Callbacks
  private onJoystickMove?: (state: JoystickState) => void
  private onButtonPress?: (button: keyof ButtonState) => void
  private onButtonRelease?: (button: keyof ButtonState) => void

  constructor() {
    this.joystickState = {
      active: false,
      angle: 0,
      distance: 0,
      direction: { x: 0, y: 0 }
    }

    this.buttonState = {
      E: false,
      T: false,
      M: false,
      U: false
    }

    this.buttons = new Map()

    // Crea il container principale
    this.container = this.createContainer()

    // Crea joystick
    this.joystickContainer = this.createJoystickContainer()
    this.joystickBase = this.createJoystickBase()
    this.joystickStick = this.createJoystickStick()

    this.joystickBase.appendChild(this.joystickStick)
    this.joystickContainer.appendChild(this.joystickBase)
    this.container.appendChild(this.joystickContainer)

    // Crea pulsanti ETMU
    this.buttonsContainer = this.createButtonsContainer()
    this.createButtons()
    this.container.appendChild(this.buttonsContainer)

    // Setup event listeners
    this.setupJoystickEvents()
    this.setupButtonEvents()

    // Aggiungi al DOM
    document.body.appendChild(this.container)

    console.log('🎮 VirtualControls initialized')
  }

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div')
    container.id = 'virtual-controls'
    container.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 200px;
      pointer-events: none;
      z-index: 1000;
      display: none;
    `
    return container
  }

  private createJoystickContainer(): HTMLDivElement {
    const container = document.createElement('div')
    container.id = 'swipe-zone-container'
    container.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 80px;
      pointer-events: auto;
    `
    return container
  }

  private createJoystickBase(): HTMLDivElement {
    const base = document.createElement('div')
    base.id = 'swipe-zone'
    base.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.08);
      border-top: 2px solid rgba(255, 255, 255, 0.25);
      border-radius: 15px 15px 0 0;
      box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(5px);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Arial, sans-serif;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
      user-select: none;
      -webkit-user-select: none;
    `
    base.innerHTML = '← Swipe laterale = Movimento | ↑ Swipe su = Salto →'
    return base
  }

  private createJoystickStick(): HTMLDivElement {
    // Non serve più lo stick visuale per swipe
    const stick = document.createElement('div')
    stick.style.display = 'none'
    return stick
  }

  private createButtonsContainer(): HTMLDivElement {
    const container = document.createElement('div')
    container.id = 'buttons-container'
    container.style.cssText = `
      position: absolute;
      bottom: 30px;
      right: 30px;
      display: grid;
      grid-template-columns: repeat(2, 60px);
      grid-template-rows: repeat(2, 60px);
      gap: 15px;
      pointer-events: auto;
    `
    return container
  }

  private createButtons(): void {
    // 🚫 PULSANTI COMPLETAMENTE RIMOSSI - Solo swipe per controlli
    // Nessun pulsante creato per massima pulizia UI
  }

  private swipeStartY: number = 0 // Per rilevare swipe verticale

  private setupJoystickEvents(): void {
    const handleStart = (x: number, y: number, touchId: number) => {
      if (this.joystickTouchId !== null) return // Già in uso

      this.joystickTouchId = touchId
      this.joystickState.active = true
      this.swipeStartY = y // Memorizza Y iniziale per swipe up
      this.updateSwipePosition(x)
    }

    const handleMove = (x: number, y: number, touchId: number) => {
      if (this.joystickTouchId !== touchId) return

      // 🆕 SWIPE UP per saltare - OTTIMIZZATO per responsività
      const deltaY = this.swipeStartY - y
      if (deltaY > 30 && this.swipeStartY > 0) {
        // Swipe verso l'alto di almeno 30px = SALTO (ridotto da 50px per meno latenza)
        console.log('🦘 Swipe UP detected! Triggering jump...')
        if (this.onButtonPress) {
          this.onButtonPress('E') // Simula pressione pulsante E (salto)
        }
        this.swipeStartY = y // Reset a posizione attuale (permette salti consecutivi)
        return
      }

      this.updateSwipePosition(x)
    }

    const handleEnd = (touchId: number) => {
      if (this.joystickTouchId !== touchId) return

      this.joystickTouchId = null
      this.joystickState.active = false
      this.swipeStartY = 0 // Reset Y
      this.resetJoystick()
    }

    // Touch events
    this.joystickBase.addEventListener('touchstart', (e) => {
      e.preventDefault()
      const touch = e.changedTouches[0]
      handleStart(touch.clientX, touch.clientY, touch.identifier)
    })

    this.joystickBase.addEventListener('touchmove', (e) => {
      e.preventDefault()
      const touch = Array.from(e.changedTouches).find(t => t.identifier === this.joystickTouchId)
      if (touch) {
        handleMove(touch.clientX, touch.clientY, touch.identifier)
      }
    })

    this.joystickBase.addEventListener('touchend', (e) => {
      e.preventDefault()
      const touch = Array.from(e.changedTouches).find(t => t.identifier === this.joystickTouchId)
      if (touch) {
        handleEnd(touch.identifier)
      }
    })

    // Mouse events (per testing desktop)
    this.joystickBase.addEventListener('mousedown', (e) => {
      e.preventDefault()
      handleStart(e.clientX, e.clientY, -1)
    })

    document.addEventListener('mousemove', (e) => {
      if (this.joystickTouchId === -1) {
        handleMove(e.clientX, e.clientY, -1)
      }
    })

    document.addEventListener('mouseup', () => {
      if (this.joystickTouchId === -1) {
        handleEnd(-1)
      }
    })
  }

  private updateSwipePosition(clientX: number): void {
    const baseRect = this.joystickBase.getBoundingClientRect()
    const centerX = baseRect.left + baseRect.width / 2
    const zoneWidth = baseRect.width

    // Calcola posizione relativa al centro (-1 a sinistra, +1 a destra)
    const deltaX = clientX - centerX
    const normalizedX = Math.max(-1, Math.min(1, deltaX / (zoneWidth / 2)))

    // Aggiorna stato (solo direzione X)
    this.joystickState.angle = normalizedX > 0 ? 0 : Math.PI
    this.joystickState.distance = Math.abs(normalizedX)
    this.joystickState.direction = {
      x: normalizedX,
      y: 0
    }

    // Callback
    if (this.onJoystickMove) {
      this.onJoystickMove(this.joystickState)
    }
  }

  private resetJoystick(): void {
    this.joystickStick.style.transform = 'translate(0, 0)'
    this.joystickState.angle = 0
    this.joystickState.distance = 0
    this.joystickState.direction = { x: 0, y: 0 }

    if (this.onJoystickMove) {
      this.onJoystickMove(this.joystickState)
    }
  }

  private setupButtonEvents(): void {
    this.buttons.forEach((button, label) => {
      const buttonKey = label as keyof ButtonState

      // Solo il pulsante E è attivo per ora
      if (buttonKey !== 'E') return

      const handlePress = () => {
        this.buttonState[buttonKey] = true
        button.style.transform = 'scale(0.9)'
        button.style.background = 'rgba(100, 168, 52, 1)'

        if (this.onButtonPress) {
          this.onButtonPress(buttonKey)
        }
      }

      const handleRelease = () => {
        this.buttonState[buttonKey] = false
        button.style.transform = 'scale(1)'
        button.style.background = 'rgba(100, 168, 52, 0.9)'

        if (this.onButtonRelease) {
          this.onButtonRelease(buttonKey)
        }
      }

      // Touch events
      button.addEventListener('touchstart', (e) => {
        e.preventDefault()
        handlePress()
      })

      button.addEventListener('touchend', (e) => {
        e.preventDefault()
        handleRelease()
      })

      // Mouse events
      button.addEventListener('mousedown', (e) => {
        e.preventDefault()
        handlePress()
      })

      button.addEventListener('mouseup', (e) => {
        e.preventDefault()
        handleRelease()
      })
    })
  }

  // Public API
  public show(): void {
    this.container.style.display = 'block'
    console.log('🎮 Virtual controls shown')
  }

  public hide(): void {
    this.container.style.display = 'none'
    console.log('🎮 Virtual controls hidden')
  }

  public setJoystickCallback(callback: (state: JoystickState) => void): void {
    this.onJoystickMove = callback
  }

  public setButtonPressCallback(callback: (button: keyof ButtonState) => void): void {
    this.onButtonPress = callback
  }

  public setButtonReleaseCallback(callback: (button: keyof ButtonState) => void): void {
    this.onButtonRelease = callback
  }

  public getJoystickState(): JoystickState {
    return { ...this.joystickState }
  }

  public getButtonState(): ButtonState {
    return { ...this.buttonState }
  }

  public destroy(): void {
    this.container.remove()
    console.log('🎮 Virtual controls destroyed')
  }
}
