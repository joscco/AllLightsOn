import Phaser from "phaser";
import {ConnectionPartner} from "../interfaces/ConnectionPartner";

export class Light extends  ConnectionPartner {
    private _isOn?: boolean;
    constructor(scene: Phaser.Scene, on: boolean) {
        super(scene, 'light_off');
        this.setOrigin(0.5, 0.7)
        this.setOn(on)
        scene.add.existing(this)
    }

    reset() {
        this.setOn(false)
    }

    getColWidth(): number {
        return 3
    }
    getRowWidth(): number {
        return 4
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
        this.setTexture(this._isOn
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