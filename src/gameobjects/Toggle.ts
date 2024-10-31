import Phaser from "phaser";
import {ConnectionPartner} from "../interfaces/ConnectionPartner";

export class Toggle extends ConnectionPartner {
    private _isOn: boolean = false;

    constructor(scene: Phaser.Scene, on: boolean) {
        super(scene, 'toggle_on');
        this.setOn(on)
        scene.add.existing(this)
    }

    reset() {
        this.setOn(false)
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
        return numberOfLeftConnections == 0
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
        return
    }

    isPowerSource(): boolean {
        return false
    }

    consume(): void {
        this.setOn(!this.isOn())
    }

    setOn(value: boolean) {
        this._isOn = value;
        this.setTexture(this._isOn
            ? 'toggle_on'
            : 'toggle_off');
    }

    isOn(): boolean {
        return this._isOn;
    }
}