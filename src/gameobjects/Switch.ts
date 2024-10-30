import Phaser from "phaser";
import {ConnectionPartner} from "../interfaces/ConnectionPartner";

export class Switch extends Phaser.GameObjects.Image implements ConnectionPartner {
    private _isOn: boolean;

    constructor(scene: Phaser.Scene, on: boolean) {
        super(scene, 0, 0, on ? 'switch_on' : 'switch_off');
        this._isOn = on;
        scene.add.existing(this)
    }

    powerCanBeForwarded(power: boolean): boolean {
        return this.isOn() && power
    }
    powerForwardCanBeChecked(): boolean {
        throw new Error("Method not implemented.");
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