import Phaser from "phaser";
import {ConnectionPartner} from "../interfaces/ConnectionPartner";

export class Switch extends ConnectionPartner {
    private _isOn: boolean = false;
    // private anyPowerProvided: boolean = false;

    constructor(scene: Phaser.Scene, on: boolean) {
        super(scene, 'switch_on');
        this.setOn(on)
        scene.add.existing(this)
    }

    reset() {
        // this.anyPowerProvided = false
    }

    getColWidth(): number {
        return 4
    }

    getRowWidth(): number {
        return 4
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
        this.setTexture(this._isOn
            ? 'switch_on'
            : 'switch_off');
    }

    isOn(): boolean {
        return this._isOn;
    }
}