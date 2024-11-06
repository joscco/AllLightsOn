import Image = Phaser.GameObjects.Image;
import TweenChain = Phaser.Tweens.TweenChain;
import {Scene} from "phaser";
import NineSlice = Phaser.GameObjects.NineSlice;
import Container = Phaser.GameObjects.Container;
import Graphics = Phaser.GameObjects.Graphics;
import {Connection} from "../gameobjects/Connection";

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

export abstract class Item extends Container {

    protected base: NineSlice
    protected sprite?: Image
    protected insGraphics: Graphics
    protected outsGraphics: Graphics

    constructor(scene: Scene, texture: string | null) {
        super(scene, 0, 0);
        // Slight offset to top because of the bottom border
        var baseTexture = this.getBaseTexture()
        this.base = scene.add.nineslice(0, 5, baseTexture, 0, 0, 0, 25, 25, 25, 25)
        this.add(this.base)

        if (texture) {
            this.sprite = scene.add.image(0, -1, texture)
            this.add(this.sprite)
        }


        this.insGraphics = scene.add.graphics({
            fillStyle: {
                color: GameColors.DARK
            }
        })
        this.outsGraphics = scene.add.graphics({
            fillStyle: {
                color: GameColors.LIGHT
            }
        })
        this.add([this.insGraphics, this.outsGraphics])
    }

    setWithUnitSize(gridUnitSize: number) {
        // Little less size to make it quadratic with bottom
        var width = gridUnitSize * (this.getColWidth()) + 5
        var height = gridUnitSize * (this.getRowHeight())
        this.base.setSize(width, height)
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

    abstract getNumberOfInputs(): number

    abstract getNumberOfOutputs(): number

    abstract getColWidth(): number

    abstract getRowHeight(): number

    private wiggleTween?: TweenChain

    // Electricity stuff
    abstract reset(): void

    // Consume power
    abstract consume(): void;

    // Can this partner generally forward power?
    abstract isPowerForwarder(): boolean

    abstract isPowerSource(): boolean

    abstract isLightBulb(): boolean

    // Can this partner forward now if power is available
    abstract powerAvailableAfter(incomingConnections: Connection[]): boolean;

    // Can this partners forwarding be checked now?
    abstract powerForwardCanBeChecked(incomingConnections: Connection[]): boolean;

    abstract onClick(): void;

    public wiggle(): void {
        this.wiggleTween?.stop()
        let currentX = this.x
        this.wiggleTween = this.scene.tweens.chain({
            targets: this,
            onStop: () => {
                this.x = currentX
            },
            tweens: [{
                x: currentX + 3,
                duration: 50,
                ease: Phaser.Math.Easing.Quadratic.InOut,
            }, {
                x: currentX - 3,
                duration: 50,
                ease: Phaser.Math.Easing.Quadratic.InOut,
            }, {
                x: currentX + 3,
                duration: 50,
                ease: Phaser.Math.Easing.Quadratic.InOut,
            }, {
                x: currentX - 3,
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