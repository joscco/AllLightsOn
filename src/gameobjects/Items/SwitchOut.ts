import Phaser from "phaser";
import {GameBaseColor, Item} from "../../interfaces/Item";
import {Connection, PowerInfo} from "../Connection";
import {vec2Equals} from "../../Helpers/VecMath";
import {GridSize} from "../Grid";

// Allows switching between multiple outputs
export class SwitchOut extends Item {
    private useUpper: boolean = false;
    private isAbleToForward: boolean = false

    constructor(scene: Phaser.Scene, upper: boolean) {
        super(scene, 'switch_up_off');
        this.setUpper(upper)
        scene.add.existing(this)
        this.setAbleToForward(false)
    }

    getNumberOfInputs(): number {
        return 1
    }

    getNumberOfOutputs(): number {
        return 2
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

    allowsForwarding(powerInfo: PowerInfo, outgoingConnection: Connection): boolean {
        let [upperOutgoingIndex, lowerOutgoingIndex] = this.getOutcomingConnectorIndices().sort((a, b) => a.y - b.y)
        if (this.useUpper) {
            return vec2Equals(outgoingConnection.getSourceIndex()!, upperOutgoingIndex)
        } else {
            return vec2Equals(outgoingConnection.getSourceIndex()!, lowerOutgoingIndex)
        }
    }

    powerAvailableAfter(incomingConnections: Connection[]): boolean {
        let availableAfter = incomingConnections.some(connection => connection.isDirectedWithPower())
        this.setAbleToForward(availableAfter)
        return availableAfter
    }

    powerForwardCanBeChecked(incomingConnections: Connection[]): boolean {
        return incomingConnections.some(connection => connection.isDirectedWithPower())
    }

    onClick() {
        this.setUpper(!this.useUpper)
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

    setUpper(value: boolean) {
        this.useUpper = value;
    }
}