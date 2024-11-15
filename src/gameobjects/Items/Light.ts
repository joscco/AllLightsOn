import Phaser from "phaser";
import {GameBaseColor, Item} from "../../interfaces/Item";
import {Connection} from "../Connection";
import Image = Phaser.GameObjects.Image;

// Turns power into light
export class Light extends Item {
    private _isOn?: boolean;
    private onSprite: Image
    private overlay: Image

    constructor(scene: Phaser.Scene, gridUnitSize: number) {
        super(scene, 'light_off', gridUnitSize);
        scene.add.existing(this)

        this.sprite!.setPosition(0, -67)

        this.onSprite = this.scene.add.image(0, -67, 'light_on')
        this.overlay = this.scene.add.image(0, -170, 'light_overlay')
        this.add([this.overlay, this.onSprite])
        this.setOn(false, true)
    }

    getBaseColor(): GameBaseColor {
        return GameBaseColor.BLUE
    }

    reset() {
        this.setOn(false)
    }

    getNumberOfInputs(): number {
        return 1
    }
    getNumberOfOutputs(): number {
        return 0
    }

    getColWidth(): number {
        return 1
    }
    getRowHeight(): number {
        return 1
    }

    onClick() {
        return
    }

    powerAvailableAfter(): boolean {
        throw new Error("Method not implemented.");
    }

    powerForwardCanBeChecked(numberOfLeftConnections: Connection[]): boolean {
        throw new Error("Method not implemented.");
    }

    isLightBulb(): boolean {
        return true
    }

    isPowerForwarder(): boolean {
        return false
    }
    isPowerSource(): boolean {
        return false
    }

    private setOn(value: boolean, instant: boolean = false) {
        this._isOn = value;
        let alphaValue = this._isOn ? 1 : 0

        if (instant) {
            this.onSprite.setAlpha(alphaValue)
            this.overlay.setAlpha(alphaValue)
        } else {
            this.scene.tweens.add({
                targets: [this.onSprite, this.overlay],
                alpha: alphaValue,
                duration: 200,
                ease: Phaser.Math.Easing.Quadratic.InOut
            })
        }
    }

    isOn(): boolean {
        return this._isOn ?? false;
    }

    consume(incomingConnections: Connection[]): void {
        if (incomingConnections.some(connection => connection.isDirectedWithPower())) {
            this.setOn(true);
        }
    }
}