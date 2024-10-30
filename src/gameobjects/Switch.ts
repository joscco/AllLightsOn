import Phaser from "phaser";
import {Consumer} from "../interfaces/Consumer";

export class Switch extends Phaser.GameObjects.Image implements Consumer {
    private _isOn: boolean;
    private consumers: Consumer[];

    constructor(scene: Phaser.Scene, on: boolean) {
        super(scene, 0, 0, on ? 'switch_on' : 'switch_off');
        this._isOn = on;
        scene.add.existing(this)
        this.consumers = [];
    }

    addConsumer(newConsumer: Consumer) {
        this.consumers.push(newConsumer)
    }

    consume(power: boolean): void {
        let forward = power && this._isOn
        this.consumers.forEach(consumer => consumer.consume(forward));
    }

    setOn(value: boolean) {
        this._isOn = value;
        this.setTexture(this._isOn
            ? 'switch_on'
            : 'switch_off');
    }

    isOn(): boolean {
        return this._isOn;
    }
}