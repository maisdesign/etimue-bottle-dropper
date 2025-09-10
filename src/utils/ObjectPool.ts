export class ObjectPool<T extends Phaser.GameObjects.GameObject & { setActive?: (active: boolean) => T; setVisible?: (visible: boolean) => T }> {
  private pool: T[] = []
  private createFn: () => T
  private resetFn?: (obj: T) => void
  
  constructor(createFn: () => T, resetFn?: (obj: T) => void, initialSize: number = 10) {
    this.createFn = createFn
    this.resetFn = resetFn
    
    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      const obj = this.createFn()
      obj.setActive?.(false)
      obj.setVisible?.(false)
      this.pool.push(obj)
    }
  }
  
  get(): T {
    let obj = this.pool.pop()
    
    if (!obj) {
      obj = this.createFn()
    }
    
    obj.setActive?.(true)
    obj.setVisible?.(true)
    
    return obj
  }
  
  release(obj: T): void {
    obj.setActive?.(false)
    obj.setVisible?.(false)
    
    if (this.resetFn) {
      this.resetFn(obj)
    }
    
    this.pool.push(obj)
  }
  
  clear(): void {
    this.pool.forEach(obj => {
      if (obj.destroy) {
        obj.destroy()
      }
    })
    this.pool = []
  }
  
  getPoolSize(): number {
    return this.pool.length
  }
}

export class BottlePool extends ObjectPool<Phaser.Physics.Arcade.Sprite> {
  private scene: Phaser.Scene
  private group: Phaser.Physics.Arcade.Group
  
  constructor(scene: Phaser.Scene, group: Phaser.Physics.Arcade.Group, defaultTextureKey: string, initialSize: number = 15) {
    const createBottle = () => {
      const bottle = scene.physics.add.sprite(0, 0, defaultTextureKey)
      group.add(bottle)
      return bottle
    }
    
    const resetBottle = (bottle: Phaser.Physics.Arcade.Sprite) => {
      // Reset bottle properties
      bottle.setPosition(0, -100)
      bottle.setVelocity(0, 0)
      bottle.setScale(1)
      bottle.setRotation(0)
      bottle.setTint(0xffffff)
      bottle.clearTint()
      bottle.removeData('isGood')
      bottle.removeData('autoDestroy')
      // Remove from any physics bodies
      if (bottle.body) {
        bottle.body.setVelocity(0, 0)
      }
    }
    
    super(createBottle, resetBottle, initialSize)
    this.scene = scene
    this.group = group
  }
  
  getBottle(textureKey: string): Phaser.Physics.Arcade.Sprite {
    const bottle = this.get()
    bottle.setTexture(textureKey)
    return bottle
  }
}

export class PowerupPool extends ObjectPool<Phaser.Physics.Arcade.Sprite> {
  constructor(scene: Phaser.Scene, group: Phaser.Physics.Arcade.Group, textureKey: string, initialSize: number = 5) {
    super(
      () => {
        const powerup = scene.physics.add.sprite(0, 0, textureKey)
        group.add(powerup)
        return powerup
      },
      (powerup) => {
        // Reset powerup properties
        powerup.setPosition(0, -100)
        powerup.setVelocity(0, 0)
        powerup.setScale(1)
        powerup.setRotation(0)
        powerup.setTint(0xffffff)
        powerup.clearTint()
        // Remove from any physics bodies
        if (powerup.body) {
          powerup.body.setVelocity(0, 0)
        }
      },
      initialSize
    )
  }
}