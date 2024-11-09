import Phaser from "phaser";
import {GameBaseColor, Item} from "../../interfaces/Item";
import {Connection, PowerInfo} from "../Connection";
import {vec2Equals} from "../../Helpers/VecMath";

// Allows switching between multiple inputs
export class SwitchIn extends Item {
    private useUpper: boolean = false;

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
        let [upperConnectorIndex, lowerConnectorIndex] = this.getIncomingConnectorIndices().sort((a, b) => a.y - b.y)
        let upperConnection = incomingConnections.find(c => vec2Equals(c.getConsumerIndex()!, upperConnectorIndex))
        let lowerConnection = incomingConnections.find(c => vec2Equals(c.getConsumerIndex()!, lowerConnectorIndex))
        if (this.useUpper) {
            return !!upperConnection && (upperConnection.isDirectedWithPower())
        }
        return !!lowerConnection && (lowerConnection.isDirectedWithPower())
    }

    powerForwardCanBeChecked(incomingConnections: Connection[]): boolean {
        let [upperConnectorIndex, lowerConnectorIndex] = this.getIncomingConnectorIndices().sort((a, b) => a.y - b.y)
        let upperConnection = incomingConnections.find(c => vec2Equals(c.getConsumerIndex()!, upperConnectorIndex))
        let lowerConnection = incomingConnections.find(c => vec2Equals(c.getConsumerIndex()!, lowerConnectorIndex))
        if (this.useUpper) {
            return !!upperConnection && (upperConnection.getPowerInfo() != PowerInfo.NO_INFO)
        }
        return !!lowerConnection && (lowerConnection.getPowerInfo() != PowerInfo.NO_INFO)
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