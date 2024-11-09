import Phaser from "phaser";
import {Item, GameBaseColor} from "../../interfaces/Item";
import {Connection} from "../Connection";

// Allows switching between multiple outputs
export class SwitchOut extends Item {
    private useUpper: boolean = false;

    // TODO: This needs reference to connectors!
    constructor(scene: Phaser.Scene, upper: boolean) {
        super(scene, 'switch_up_off');
        this.setUpper(upper)
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
        return 1
    }

    getRowHeight(): number {
        return 2
    }

    powerAvailableAfter(): boolean {
        return this.isUpper()
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
        this.setUpper(!this.isUpper())
    }

    isPowerSource(): boolean {
        return false
    }

    consume(): void {
        return
    }

    setUpper(value: boolean) {
        this.useUpper = value;
        this.sprite!.setTexture(this.useUpper
            ? 'switch_up_off'
            : 'switch_down_off');
    }

    isUpper(): boolean {
        return this.useUpper;
    }
}