import Phaser from "phaser";
import {Item, GameBaseColor} from "../../interfaces/Item";
import {Connection} from "../Connection";
import {GridSize} from "../Grid";

// Links one source to multiple outputs
export class Splitter extends Item {

    constructor(scene: Phaser.Scene) {
        super(scene, '');
        scene.add.existing(this)
    }

    getBaseColor(): GameBaseColor {
        return GameBaseColor.BLUE
    }

    reset() {
    }

    getNumberOfInputs(): number {
        return 1
    }
    getNumberOfOutputs(): number {
        return 2
    }

    getColWidth(): number {
        return 1
    }
    getRowHeight(): number {
        return 2
    }

    onClick() {
        return
    }

    powerAvailableAfter(incomingConnections: Connection[]): boolean {
        return incomingConnections.some(connection => connection.isDirectedWithPower())
    }

    powerForwardCanBeChecked(incomingConnections: Connection[]): boolean {
        return incomingConnections.some(connection => connection.isDirectedWithPower())
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