import Phaser from "phaser";
import {Item, GameBaseColor} from "../../interfaces/Item";
import {Connection} from "../Connection";

// Allows switching between multiple outputs
export class SwitchOut extends Item {
    private _isOn: boolean = false;

    // TODO: This needs reference to connectors!
    constructor(scene: Phaser.Scene, on: boolean) {
        super(scene, 'stopper_on');
        this.setOn(on)
        scene.add.existing(this)
    }

    getNumberOfInputs(): number {
        return 1
    }
    getNumberOfOutputs(): number {
        return 2
    }

    reset() {
        // this.anyPowerProvided = false
    }

    getBaseColor(): GameBaseColor {
        return GameBaseColor.ORANGE
    }

    getColWidth(): number {
        return 2
    }

    getRowHeight(): number {
        return 2
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
        // this.sprite.setTexture(this._isOn
        //     ? 'switch_on'
        //     : 'switch_off');
    }

    isOn(): boolean {
        return this._isOn;
    }
}