import Phaser from "phaser";
import {ConnectionPartner, GameBaseColor} from "../interfaces/ConnectionPartner";

export class PowerSource extends ConnectionPartner {
    constructor(scene: Phaser.Scene, gridUnitSize: number) {
        super(scene, 'power_on', gridUnitSize);
        scene.add.existing(this)
    }

    getBaseColor(): GameBaseColor {
        return GameBaseColor.BLUE
    }

    getColWidth(): number {
        return 3
    }

    getRowHeight(): number {
        return 3
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