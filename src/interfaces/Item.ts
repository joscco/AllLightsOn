import Image = Phaser.GameObjects.Image;
import TweenChain = Phaser.Tweens.TweenChain;
import Container = Phaser.GameObjects.Container;
import {Scene} from "phaser";
import {Connection, PowerInfo} from "../gameobjects/Connection";
import {Vec2} from "../Helpers/VecMath";
import {DEPTHS} from "../Helpers/Depths";

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
    protected index?: Vec2
    protected incomingConnectorIndices: Vec2[] = []
    protected outgoingConnectorIndices: Vec2[] = []
    protected gridUnitSize: number
    private wiggleTween?: TweenChain

    constructor(scene: Scene, texture: string | null, gridUnitSize: number) {
        super(scene, 0, 0);
        // Slight offset to top because of the bottom border
        this.base = scene.add.image(0, 0, this.getBaseTexture(this.getRowHeight(), this.getColWidth()))
        this.add(this.base)
        this.gridUnitSize = gridUnitSize

        if (texture) {
            this.sprite = scene.add.image(0, -22, texture)
            this.add(this.sprite)
        }
        this.setDepth(DEPTHS.ITEMS)
    }

    setIndex(leftBottomIndex: Vec2) {
        this.index = leftBottomIndex
    }

    addIncomingConnectorIndex(index: Vec2) {
        this.incomingConnectorIndices.push(index)
    }

    addOutgoingConnectorIndex(index: Vec2) {
        this.outgoingConnectorIndices.push(index)
    }

    getIncomingConnectorIndices() {
        return this.incomingConnectorIndices
    }

    getOutcomingConnectorIndices() {
        return this.outgoingConnectorIndices
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

    allowsForwarding(powerInfo: PowerInfo, outgoingConnection: Connection) {
        return true;
    }
}