import Phaser from "phaser";
import {GameBaseColor, Item} from "../../interfaces/Item";
import {Connection, PowerInfo} from "../Connection";
import {vec2Equals} from "../../Helpers/VecMath";

// Allows switching between multiple inputs
export class SwitchIn extends Item {
    private useUpper: boolean = false;
    private isAbleToForward: boolean = false

    constructor(scene: Phaser.Scene, upper: boolean, gridUnitSize: number) {
        super(scene, 'switch_up_off', gridUnitSize);
        this.setUseUpper(upper)
        scene.add.existing(this)
        this.setAbleToForward(false)
    }

    getNumberOfInputs(): number {
        return 2
    }
    getNumberOfOutputs(): number {
        return 1
    }

    reset() {
        this.setAbleToForward(false)
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
        let availableAfter: boolean
        if (this.useUpper) {
            availableAfter = !!upperConnection && (upperConnection.isDirectedWithPower())
        } else {
            availableAfter = !!lowerConnection && (lowerConnection.isDirectedWithPower())
        }
        this.setAbleToForward(availableAfter)
        return availableAfter
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

    onClick() {
        this.setUseUpper(!this.useUpper)
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
        return
    }

    setAbleToForward(ableToForward: boolean) {
        this.isAbleToForward = ableToForward
        this.sprite!.setTexture(this.useUpper
            ? (this.isAbleToForward ? 'switch_up_on' : 'switch_up_off')
            : (this.isAbleToForward ? 'switch_down_on' : 'switch_down_off'))
    }

    setUseUpper(value: boolean) {
        this.useUpper = value;
    }
}