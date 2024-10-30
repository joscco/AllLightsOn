import Image = Phaser.GameObjects.Image;
import TweenChain = Phaser.Tweens.TweenChain;
import {Scene} from "phaser";

export abstract class ConnectionPartner extends Image {
    constructor(scene: Scene, texture: string) {
        super(scene, 0, 0, texture);
    }

    abstract getColWidth(): number

    abstract getRowWidth(): number

    private wiggleTween?: TweenChain

    // Electricity stuff
    abstract reset(): void

    abstract consume(power: boolean): void;

    abstract getMaxNumberOfConnections(): number

    // Can this partner generally forward power?
    abstract isForwarder(): boolean

    abstract isSource(): boolean

    abstract isLightBulb(): boolean

    // Can this partner forward now if power is available
    abstract powerAvailableAfter(power: boolean): boolean;

    // Can this partners forwarding be checked now?
    abstract powerForwardCanBeChecked(numberOfLeftConnections: number): boolean;

    abstract onClick(): void;

    public wiggle(): void {
        this.wiggleTween?.stop()
        var currentX = this.x
        this.wiggleTween = this.scene.tweens.chain({
            targets: this,
            onStop: () => {
                this.x = currentX
            },
            tweens: [{
                x: currentX + 5,
                duration: 50,
                ease: Phaser.Math.Easing.Quadratic.InOut,
            }, {
                x: currentX - 5,
                duration: 50,
                ease: Phaser.Math.Easing.Quadratic.InOut,
            }, {
                x: currentX + 5,
                duration: 50,
                ease: Phaser.Math.Easing.Quadratic.InOut,
            }, {
                x: currentX - 5,
                duration: 50,
                ease: Phaser.Math.Easing.Quadratic.InOut,
            }, {
                x: currentX,
                duration: 100,
                ease: Phaser.Math.Easing.Quadratic.InOut,
            }]
        })
    }
}