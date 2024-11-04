import Phaser from "phaser";
import {ConnectionPartner, GameBaseColor} from "../interfaces/ConnectionPartner";
import {Connection} from "./Connection";

export class Or extends ConnectionPartner {

    constructor(scene: Phaser.Scene) {
        super(scene, 'toggle_off');
        scene.add.existing(this)
    }

    getBaseColor(): GameBaseColor {
        return GameBaseColor.BLUE
    }

    reset() {
    }

    getNumberOfInputs(): number {
        return 3
    }
    getNumberOfOutputs(): number {
        return 1
    }

    getColWidth(): number {
        return 2
    }
    getRowHeight(): number {
        return 3
    }

    onClick() {
        return
    }

    powerAvailableAfter(): boolean {
        return true
    }

    powerForwardCanBeChecked(numberOfLeftConnections: Connection[]): boolean {
        return true
    }

    isLightBulb(): boolean {
        return false
    }

    isPowerForwarder(): boolean {
        return true
    }
    isPowerSource(): boolean {
        return false
    }

    consume(): void {
    }
}