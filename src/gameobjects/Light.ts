import Phaser from "phaser";
import {ConnectionPartner} from "../interfaces/ConnectionPartner";

export class Light extends Phaser.GameObjects.Image implements ConnectionPartner {
    private _isOn?: boolean;

    constructor(scene: Phaser.Scene, on: boolean) {
        super(scene, 0, 0, 'light_off');
        this.setOrigin(0.5, 0.7)
        this.setOn(on)
        scene.add.existing(this)
    }

    reset() {
        this.setOn(false)
    }

    onClick() {
        return
    }

    powerAvailableAfter(power: boolean): boolean {
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
    isForwarder(): boolean {
        return false
    }
    isSource(): boolean {
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

    consume(power: boolean): void {
        this.setOn(power);
    }
}