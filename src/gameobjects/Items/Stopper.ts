import Phaser from "phaser";
import {GameBaseColor, Item} from "../../interfaces/Item";
import {Connection, PowerInfo} from "../Connection";
import {GridSize} from "../Grid";

// Allows stopping power flow
export class Stopper extends Item {

    private _isOn: boolean = false;

    constructor(scene: Phaser.Scene, on: boolean) {
        super(scene, 'stopper_on');
        this.sprite?.setPosition(0, -33)
        this.setOn(on)
        scene.add.existing(this)
    }

    getNumberOfInputs(): number {
        return 1
    }

    getNumberOfOutputs(): number {
        return 1
    }

    reset() {

    }

    getBaseColor(): GameBaseColor {
        return GameBaseColor.ORANGE
    }

    getColWidth(): number {
        return 2
    }

    getRowHeight(): number {
        return 1
    }

    powerAvailableAfter(incomingConnections: Connection[]): boolean {
        return this.isOn() && incomingConnections[0].isDirectedWithPower()
    }

    powerForwardCanBeChecked(incomingConnections: Connection[]): boolean {
        return incomingConnections.length > 0
            && (
                incomingConnections.some(connection => connection.isDirectedWithPower()) ||
                incomingConnections.every(connection => connection.getPowerInfo() != PowerInfo.NO_INFO))
    }

    isLightBulb(): boolean {
        return false
    }

    isPowerForwarder(): boolean {
        return true
    }

    onClick() {
        this.setOn(!this.isOn())
    }

    isPowerSource(): boolean {
        return false
    }

    consume(): void {
        return
    }

    setOn(value: boolean) {
        this._isOn = value;
        this.sprite!.setTexture(this._isOn
            ? 'stopper_on'
            : 'stopper_off');
    }

    isOn(): boolean {
        return this._isOn;
    }
}