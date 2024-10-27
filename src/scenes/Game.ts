import Phaser from 'phaser';

export default class Demo extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.image('light_off', 'assets/Light_Off.png');
        this.load.image('light_on', 'assets/Light_On.png');
    }

    create() {
        const light = this.add.sprite(960, 540, 'light_off');
        let light_on = false;
        light.setInteractive()
        light.on('pointerdown', () => {
            light_on = !light_on;
            light.setTexture(light_on ? 'light_on' : 'light_off');
        })
    }
}
