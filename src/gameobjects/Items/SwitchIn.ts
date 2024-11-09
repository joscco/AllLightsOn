import Phaser from "phaser";
import {Item, GameBaseColor} from "../../interfaces/Item";
import {Connection} from "../Connection";

// Allows switching between multiple inputs
export class SwitchIn extends Item {
    private useUpper: boolean = false;

    // TODO: This needs reference to connectors!
    constructor(scene: Phaser.Scene, upper: boolean) {
        super(scene, 'switch_up_off');
        this.setUseUpper(upper)
        scene.add.existing(this)
    }

    getNumberOfInputs(): number {
        return 2
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
        return 1
    }

    getRowHeight(): number {
        return 2
    }

    powerAvailableAfter(incomingConnections: Connection[]): boolean {
        return this.isUsingUpper()
    }

    powerForwardCanBeChecked(incomingConnections: Connection[]): boolean {
        if (this.useUpper) {
            return false
        }
        return true
    }

    isLightBulb(): boolean {
        return false
    }

    isPowerForwarder(): boolean {
        return true
    }

    onClick() {
        this.setUseUpper(!this.isUsingUpper())
    }

    isPowerSource(): boolean {
        return false
    }

    consume(): void {
        return
    }

    setUseUpper(value: boolean) {
        this.useUpper = value;
        this.sprite!.setTexture(this.useUpper
            ? 'switch_up_off'
            : 'switch_down_off');
    }

    isUsingUpper(): boolean {
        return this.useUpper;
    }
}