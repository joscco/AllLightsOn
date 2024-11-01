import Phaser from "phaser";
import {ConnectionPartner, GameBaseColor} from "../interfaces/ConnectionPartner";

export class Switch extends ConnectionPartner {
    private _isOn: boolean = false;
    // private anyPowerProvided: boolean = false;
    constructor(scene: Phaser.Scene, on: boolean, gridUnitSize: number) {
        super(scene, 'switch_on', gridUnitSize);
        this.setOn(on)
        scene.add.existing(this)
    }

    reset() {
        // this.anyPowerProvided = false
    }

    getBaseColor(): GameBaseColor {
        return GameBaseColor.ORANGE
    }

    getColWidth(): number {
        return 3
    }

    getRowHeight(): number {
        return 3
    }

    powerAvailableAfter(): boolean {
        return this.isOn()
    }

    powerForwardCanBeChecked(numberOfLeftConnections: number): boolean {
        return true
        // return numberOfLeftConnections == 0 || this.anyPowerProvided
    }

    isLightBulb(): boolean {
        return false
    }

    getMaxNumberOfConnections(): number {
        return 20
    }

    isPowerForwarder(): boolean {
        return true
    }

    onClick() {
        this.setOn(!this.isOn())
    }

    isPowerSource(): boolean {
        return false
    }

    consume(): void {
        return
    }

    setOn(value: boolean) {
        this._isOn = value;
        this.sprite.setTexture(this._isOn
            ? 'switch_on'
            : 'switch_off');
    }

    isOn(): boolean {
        return this._isOn;
    }
}