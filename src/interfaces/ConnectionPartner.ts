import Image = Phaser.GameObjects.Image;
import TweenChain = Phaser.Tweens.TweenChain;
import {Scene} from "phaser";
import NineSlice = Phaser.GameObjects.NineSlice;
import Container = Phaser.GameObjects.Container;

export enum GameBaseColor {
    ORANGE,
    BLUE
}

export const GameColors = {
    BLUE: 0x1b3953,
    DARK_BLUE: 0x112941,
    DARK: 0x091b2f,
    RED: 0xc77e58,
    DARK_RED: 0xa96544,
    ORANGE: 0xeca360,
    LIGHT_ORANGE: 0xf5d0a1,
    LIGHT: 0xfae8d5
}

export abstract class ConnectionPartner extends Container {

    protected base: NineSlice
    protected sprite: Image

    constructor(scene: Scene, texture: string, gridUnitSize: number) {
        super(scene, 0, 0);
        // Slight offset to top because of the bottom border
        this.sprite = scene.add.image(0, -5, texture)
        var baseTexture = this.getBaseTexture()
        var width = gridUnitSize * (this.getColWidth())
        var height = gridUnitSize * (this.getRowHeight())
        this.base = scene.add.nineslice(0, 0, baseTexture, 0, width, height, 25, 25, 25, 25)
        this.add([this.base, this.sprite])
    }

    abstract getBaseColor(): GameBaseColor

    getBaseTexture(): string {
        switch (this.getBaseColor()) {
            case GameBaseColor.BLUE:
                return 'base_blue'
            case GameBaseColor.ORANGE:
                return 'base_orange'
        }
    }

    abstract getColWidth(): number

    abstract getRowHeight(): number

    private wiggleTween?: TweenChain

    // Electricity stuff
    abstract reset(): void

    // Consume power
    abstract consume(): void;

    abstract getMaxNumberOfConnections(): number

    // Can this partner generally forward power?
    abstract isPowerForwarder(): boolean

    abstract isPowerSource(): boolean

    abstract isLightBulb(): boolean

    // Can this partner forward now if power is available
    abstract powerAvailableAfter(): boolean;

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