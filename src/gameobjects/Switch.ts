import Phaser from "phaser";
import {ConnectionPartner} from "../interfaces/ConnectionPartner";

export class Switch extends Phaser.GameObjects.Image implements ConnectionPartner {
    private _isOn: boolean;
    private anyPowerProvided: boolean = false;

    constructor(scene: Phaser.Scene, on: boolean) {
        super(scene, 0, 0, on ? 'switch_on' : 'switch_off');
        this._isOn = on;
        scene.add.existing(this)
    }

    reset() {
        this.anyPowerProvided = false
    }

    powerAvailableAfter(power: boolean): boolean {
        return this.isOn() && this.anyPowerProvided
    }
    powerForwardCanBeChecked(numberOfLeftConnections: number): boolean {
        return numberOfLeftConnections == 0 || this.anyPowerProvided
    }

    isLightBulb(): boolean {
        return false
    }

    getMaxNumberOfConnections(): number {
        return 20
    }
    isForwarder(): boolean {
        return true
    }

    onClick() {
        this.setOn(!this.isOn())
    }

    isSource(): boolean {
        return false
    }

    consume(power: boolean): void {
        this.anyPowerProvided = power
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