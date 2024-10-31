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

    powerAvailableAfter(power: boolean): boolean {
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

    isForwarder(): boolean {
        return true
    }

    onClick() {
        return
    }

    isSource(): boolean {
        return false
    }

    consume(power: boolean): void {
        if (power) {
            this.setOn(!this.isOn())
        }
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