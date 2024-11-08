import Image = Phaser.GameObjects.Image;
import TweenChain = Phaser.Tweens.TweenChain;
import {Scene} from "phaser";
import Container = Phaser.GameObjects.Container;
import {Connection} from "../gameobjects/Connection";
import NineSlice = Phaser.GameObjects.NineSlice;

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

export const GameColorStrings = {
    BLUE: '#1b3953',
    DARK_BLUE: '#112941',
    DARK: '#091b2f',
    RED: '#c77e58',
    DARK_RED: '#a96544',
    ORANGE: '#eca360',
    LIGHT_ORANGE: '#f5d0a1',
    LIGHT: '#fae8d5'
}

export const TEXT_COLOR_WHEN_ON = GameColorStrings.LIGHT
export const TEXT_COLOR_WHEN_OFF = GameColorStrings.DARK

export abstract class Item extends Container {

    protected base: Image
    protected sprite?: Image

    constructor(scene: Scene, texture: string | null) {
        super(scene, 0, 0);
        // Slight offset to top because of the bottom border
        this.base = scene.add.image(0, 0, this.getBaseTexture(this.getRowHeight(), this.getColWidth()))
        this.add(this.base)

        if (texture) {
            this.sprite = scene.add.image(0, -5, texture)
            this.add(this.sprite)
        }
    }

    setWithUnitSize(gridUnitSize: number) {
        // Little less size to make it quadratic with bottom
        var width = gridUnitSize * (this.getColWidth()) + 5
        var height = gridUnitSize * (this.getRowHeight()) + 5
        this.base.setSize(width, height)
    }

    abstract getBaseColor(): GameBaseColor

    getBaseTexture(rows: number, cols: number): string {
        switch (this.getBaseColor()) {
            case GameBaseColor.BLUE:
                return 'base_blue_' + cols + '_' + rows
            case GameBaseColor.ORANGE:
                return 'base_orange_' + cols + '_' + rows
        }
    }

    abstract getNumberOfInputs(): number

    abstract getNumberOfOutputs(): number

    abstract getColWidth(): number

    abstract getRowHeight(): number

    private wiggleTween?: TweenChain

    // Electricity stuff
    abstract reset(): void

    // Can this partner generally forward power?
    abstract isPowerForwarder(): boolean

    abstract isPowerSource(): boolean

    abstract isLightBulb(): boolean

    // Consume power
    abstract consume(incomingConnections: Connection[]): void;

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