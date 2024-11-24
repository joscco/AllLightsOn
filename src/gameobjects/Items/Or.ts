import Phaser from "phaser";
import {GameBaseColor, Item, TEXT_COLOR_WHEN_OFF, TEXT_COLOR_WHEN_ON} from "../../interfaces/Item";
import {Connection} from "../Connection";
import Text = Phaser.GameObjects.Text;

// Forwards power if any of the sources is on
export class Or extends Item {
    private text: Text

    constructor(scene: Phaser.Scene) {
        super(scene, '');
        scene.add.existing(this)
        this.text = scene.add.text(-6, -22, 'OR', {
            fontFamily: "ItemFont",
            fontSize: 178
        })
        this.text.setOrigin(0.5)
        this.text.angle = -90
        this.add(this.text)
        this.setOn(false)
    }

    getBaseColor(): GameBaseColor {
        return GameBaseColor.BLUE
    }

    reset() {
        this.setOn(false)
    }

    getNumberOfInputs(): number {
        return 2
    }
    getNumberOfOutputs(): number {
        return 1
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
        return incomingConnections.length >= 1 &&
            incomingConnections.some(connection => connection.isDirectedWithPower())
    }

    powerForwardCanBeChecked(incomingConnections: Connection[]): boolean {
        return incomingConnections.length >= 1 &&
            incomingConnections.some(connection => connection.isDirectedWithPower())
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

    consume(incomingConnections: Connection[]): void {
        if (incomingConnections.length >= 1 &&
            incomingConnections.some(connection => connection.isDirectedWithPower())) {
            this.setOn(true)
        }
    }

    private setOn(value: boolean) {
        this.text.setColor(value ? TEXT_COLOR_WHEN_ON : TEXT_COLOR_WHEN_OFF)
    }
}