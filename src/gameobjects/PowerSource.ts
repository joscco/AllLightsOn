import Phaser from "phaser";
import {Consumer} from "../interfaces/Consumer";

export class PowerSource extends Phaser.GameObjects.Image {
    private consumers: Consumer[]

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0, 'power_on');
        scene.add.existing(this)
        this.consumers = [];
    }

    addConsumer(newConsumer: Consumer) {
        this.consumers.push(newConsumer)
    }

    supply(power: boolean) {
        this.consumers.forEach(consumer => consumer.consume(power));
    }
}