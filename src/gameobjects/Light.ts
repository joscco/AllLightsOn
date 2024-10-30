import Phaser from "phaser";
import {Consumer} from "../interfaces/Consumer";

export class Light extends Phaser.GameObjects.Image implements Consumer {
    private _isOn?: boolean;

    constructor(scene: Phaser.Scene, on: boolean) {
        super(scene, 0, 0, 'light_off');
        this.setOrigin(0.5, 0.7)
        this.setOn(on)
        scene.add.existing(this)
    }

    private setOn(value: boolean) {
        this._isOn = value;
        this.setTexture(this._isOn
            ? 'light_on'
            : 'light_off');

    }

    isOn(): boolean {
        return this._isOn ?? false;
    }

    consume(power: boolean): void {
        this.setOn(power);
    }
}