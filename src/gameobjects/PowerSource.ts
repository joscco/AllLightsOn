import Phaser from "phaser";
import {ConnectionPartner} from "../interfaces/ConnectionPartner";

export class PowerSource extends Phaser.GameObjects.Image implements ConnectionPartner{

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0, 'power_on');
        scene.add.existing(this)
    }

    isLightBulb(): boolean {
        return false
    }

    getMaxNumberOfConnections(): number {
        return 1
    }

    isForwarder(): boolean {
        return false;
    }
    powerCanBeForwarded(power: boolean): boolean {
        throw new Error("Method not implemented.");
    }
    powerForwardCanBeChecked(): boolean {
        throw new Error("Method not implemented.");
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