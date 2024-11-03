import Phaser from "phaser";
import {ConnectionPartner, GameBaseColor} from "../interfaces/ConnectionPartner";
import {Connection} from "./Connection";

export class And extends ConnectionPartner {

    constructor(scene: Phaser.Scene) {
        super(scene, 'toggle_on');
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
        return 3
    }
    getRowHeight(): number {
        return 3
    }

    onClick() {
        return
    }

    powerAvailableAfter(incomingConnections: Connection[]): boolean {
        return incomingConnections.every(connection => connection.isDirectedWithPower())
    }

    powerForwardCanBeChecked(incomingConnections: Connection[]): boolean {
        return incomingConnections.every(connection => connection.isDirectedWithPower())
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