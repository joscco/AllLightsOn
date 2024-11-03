import Phaser from "phaser";
import {ConnectionPartner, GameBaseColor} from "../interfaces/ConnectionPartner";
import {Connection} from "./Connection";

export class Switch extends ConnectionPartner {
    private _isOn: boolean = false;
    // private anyPowerProvided: boolean = false;
    constructor(scene: Phaser.Scene, on: boolean) {
        super(scene, 'switch_on');
        this.setOn(on)
        scene.add.existing(this)
    }

    getNumberOfInputs(): number {
        return 1
    }
    getNumberOfOutputs(): number {
        return 1
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

    powerForwardCanBeChecked(numberOfLeftConnections: Connection[]): boolean {
        return true
        // return numberOfLeftConnections == 0 || this.anyPowerProvided
    }

    isLightBulb(): boolean {
        return false
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