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
  private joystickBaseRadius: number = 60
  private joystickStickRadius: number = 25

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
    container.id = 'joystick-container'
    container.style.cssText = `
      position: absolute;
      bottom: 30px;
      left: 30px;
      width: ${this.joystickBaseRadius * 2}px;
      height: ${this.joystickBaseRadius * 2}px;
      pointer-events: auto;
    `
    return container
  }

  private createJoystickBase(): HTMLDivElement {
    const base = document.createElement('div')
    base.id = 'joystick-base'
    base.style.cssText = `
      position: relative;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.15);
      border: 3px solid rgba(255, 255, 255, 0.4);
      border-radius: 50%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      backdrop-filter: blur(5px);
    `
    return base
  }

  private createJoystickStick(): HTMLDivElement {
    const stick = document.createElement('div')
    stick.id = 'joystick-stick'
    const centerOffset = this.joystickBaseRadius - this.joystickStickRadius
    stick.style.cssText = `
      position: absolute;
      width: ${this.joystickStickRadius * 2}px;
      height: ${this.joystickStickRadius * 2}px;
      background: rgba(100, 168, 52, 0.9);
      border: 3px solid rgba(255, 255, 255, 0.8);
      border-radius: 50%;
      top: ${centerOffset}px;
      left: ${centerOffset}px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
      transition: transform 0.05s ease-out;
    `
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
    const buttonLabels: Array<keyof ButtonState> = ['E', 'T', 'M', 'U']
    const buttonPositions = [
      { row: 1, col: 2 }, // E - top right (salto)
      { row: 1, col: 1 }, // T - top left
      { row: 2, col: 1 }, // M - bottom left
      { row: 2, col: 2 }  // U - bottom right
    ]

    buttonLabels.forEach((label, index) => {
      const button = document.createElement('button')
      button.id = `btn-${label}`
      button.textContent = label
      button.dataset.button = label

      const pos = buttonPositions[index]
      const isActiveButton = label === 'E' // Solo E è attivo per ora

      button.style.cssText = `
        grid-row: ${pos.row};
        grid-column: ${pos.col};
        width: 60px;
        height: 60px;
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, ${isActiveButton ? '0.8' : '0.3'});
        background: ${isActiveButton ? 'rgba(100, 168, 52, 0.9)' : 'rgba(150, 150, 150, 0.3)'};
        color: white;
        font-size: 24px;
        font-weight: bold;
        font-family: Arial, sans-serif;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(5px);
        cursor: ${isActiveButton ? 'pointer' : 'default'};
        user-select: none;
        -webkit-user-select: none;
        touch-action: none;
        opacity: ${isActiveButton ? '1' : '0.5'};
        transition: transform 0.1s ease, background 0.1s ease;
      `

      this.buttons.set(label, button)
      this.buttonsContainer.appendChild(button)
    })
  }

  private setupJoystickEvents(): void {
    const handleStart = (x: number, y: number, touchId: number) => {
      if (this.joystickTouchId !== null) return // Già in uso

      this.joystickTouchId = touchId
      this.joystickState.active = true
      this.updateJoystickPosition(x, y)
    }

    const handleMove = (x: number, y: number, touchId: number) => {
      if (this.joystickTouchId !== touchId) return
      this.updateJoystickPosition(x, y)
    }

    const handleEnd = (touchId: number) => {
      if (this.joystickTouchId !== touchId) return

      this.joystickTouchId = null
      this.joystickState.active = false
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

  private updateJoystickPosition(clientX: number, clientY: number): void {
    const baseRect = this.joystickBase.getBoundingClientRect()
    const centerX = baseRect.left + baseRect.width / 2
    const centerY = baseRect.top + baseRect.height / 2

    let deltaX = clientX - centerX
    let deltaY = clientY - centerY

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const maxDistance = this.joystickBaseRadius - this.joystickStickRadius

    // Limita il movimento al raggio del joystick
    if (distance > maxDistance) {
      const ratio = maxDistance / distance
      deltaX *= ratio
      deltaY *= ratio
    }

    // Calcola angolo e distanza normalizzata
    const angle = Math.atan2(deltaY, deltaX)
    const normalizedDistance = Math.min(distance / maxDistance, 1)

    // Aggiorna stato
    this.joystickState.angle = angle
    this.joystickState.distance = normalizedDistance
    this.joystickState.direction = {
      x: normalizedDistance * Math.cos(angle),
      y: normalizedDistance * Math.sin(angle)
    }

    // Aggiorna posizione visuale
    this.joystickStick.style.transform = `translate(${deltaX}px, ${deltaY}px)`

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
