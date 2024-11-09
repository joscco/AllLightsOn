import Phaser from "phaser";
import {Item, GameBaseColor} from "../../interfaces/Item";
import {Connection, PowerInfo} from "../Connection";
import {vec2Equals} from "../../Helpers/VecMath";

// Allows switching between multiple outputs
export class SwitchOut extends Item {
    private useUpper: boolean = false;

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

    allowsForwarding(powerInfo: PowerInfo, outgoingConnection: Connection): boolean {
        let [upperOutgoingIndex, lowerOutgoingIndex] = this.getOutcomingConnectorIndices().sort((a, b) => a.y - b.y)
        if (this.useUpper) {
            return vec2Equals(outgoingConnection.getSourceIndex()!, upperOutgoingIndex)
        }
        return vec2Equals(outgoingConnection.getSourceIndex()!, lowerOutgoingIndex)
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