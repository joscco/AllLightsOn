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

    isPowerForwarder(): boolean {
        return false;
    }

    powerAvailableAfter(): boolean {
        return true
    }

    powerForwardCanBeChecked(): boolean {
        return true
    }

    isPowerSource(): boolean {
        return true;
    }

    onClick() {
        return
    }

    consume(): void {
        return
    }
}