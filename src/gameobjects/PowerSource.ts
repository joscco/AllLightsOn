import Phaser from "phaser";
import {ConnectionPartner} from "../interfaces/ConnectionPartner";

export class PowerSource extends ConnectionPartner {

    constructor(scene: Phaser.Scene) {
        super(scene, 'power_on');
        scene.add.existing(this)
    }

    getColWidth(): number {
        return 4
    }

    getRowWidth(): number {
        return 4
    }

    reset() {
        return
    }

    isLightBulb(): boolean {
        return false
    }

    getMaxNumberOfConnections(): number {
        return 10
    }

    isForwarder(): boolean {
        return false;
    }

    powerAvailableAfter(power: boolean): boolean {
        return true
    }

    powerForwardCanBeChecked(): boolean {
        return true
    }

    isSource(): boolean {
        return true;
    }

    onClick() {
        return
    }

    consume(power: boolean): void {
        return
    }
}