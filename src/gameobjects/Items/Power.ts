import Phaser from "phaser";
import {Item, GameBaseColor} from "../../interfaces/Item";

export class Power extends Item {
    constructor(scene: Phaser.Scene) {
        super(scene, 'power_on');
        scene.add.existing(this)
    }

    getNumberOfInputs(): number {
        return 0
    }
    getNumberOfOutputs(): number {
        return 1
    }

    getBaseColor(): GameBaseColor {
        return GameBaseColor.BLUE
    }

    getColWidth(): number {
        return 2
    }

    getRowHeight(): number {
        return 2
    }

    reset() {
        return
    }

    isLightBulb(): boolean {
        return false
    }

    isPowerForwarder(): boolean {
        return false;
    }

    powerAvailableAfter(): boolean {
        return true
    }

    powerForwardCanBeChecked(): boolean {
        return true
    }

    isPowerSource(): boolean {
        return true;
    }

    onClick() {
        return
    }

    consume(): void {
        return
    }
}