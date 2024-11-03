import Phaser from "phaser";
import {ConnectionPartner, GameBaseColor} from "../interfaces/ConnectionPartner";
import {Connection} from "./Connection";

export class Light extends ConnectionPartner {
    private _isOn?: boolean;

    constructor(scene: Phaser.Scene, on: boolean) {
        super(scene, 'light_off');
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

    getNumberOfInputs(): number {
        return 1
    }
    getNumberOfOutputs(): number {
        return 0
    }

    getColWidth(): number {
        return 3
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

    powerForwardCanBeChecked(numberOfLeftConnections: Connection[]): boolean {
        throw new Error("Method not implemented.");
    }

    isLightBulb(): boolean {
        return true
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