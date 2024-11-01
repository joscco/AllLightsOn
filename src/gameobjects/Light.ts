import Phaser from "phaser";
import {ConnectionPartner, GameBaseColor} from "../interfaces/ConnectionPartner";

export class Light extends ConnectionPartner {
    private _isOn?: boolean;
    constructor(scene: Phaser.Scene, on: boolean, gridUnitSize: number) {
        super(scene, 'light_off', gridUnitSize);
        this.sprite.setOrigin(0.5, 0.7)
        this.setOn(on)
        scene.add.existing(this)
    }

    getBaseColor(): GameBaseColor {
        return GameBaseColor.BLUE
    }

    reset() {
        this.setOn(false)
    }

    getColWidth(): number {
        return 2
    }
    getRowHeight(): number {
        return 3
    }

    onClick() {
        return
    }

    powerAvailableAfter(): boolean {
        throw new Error("Method not implemented.");
    }
    powerForwardCanBeChecked(number: number): boolean {
        throw new Error("Method not implemented.");
    }

    isLightBulb(): boolean {
        return true
    }

    getMaxNumberOfConnections(): number {
        return 1
    }
    isPowerForwarder(): boolean {
        return false
    }
    isPowerSource(): boolean {
        return false
    }

    private setOn(value: boolean) {
        this._isOn = value;
        this.sprite.setTexture(this._isOn
            ? 'light_on'
            : 'light_off');

    }

    isOn(): boolean {
        return this._isOn ?? false;
    }

    consume(): void {
        this.setOn(true);
    }
}