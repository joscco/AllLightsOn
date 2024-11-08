import Phaser from "phaser";
import {Item, GameBaseColor, GameColors} from "../../interfaces/Item";

// Produces power
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
        return 1
    }

    getRowHeight(): number {
        return 1
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