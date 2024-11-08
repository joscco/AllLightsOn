import Phaser from 'phaser';


export default class Preloader extends Phaser.Scene {

    constructor() {
        super({key: 'Preloader', active: true});
    }

    preload() {
        this.load.on('progress', (value: number) => {
            console.log(value);
        });

        this.load.on('fileprogress', (file: any) => {
            console.log(file.src);
        });
        this.load.on('complete', function () {
            console.log('complete');
        });

        this.load.image('base_blue_1_1', 'assets/images/Blue_1_1.png');
        this.load.image('base_blue_2_1', 'assets/images/Blue_2_1.png');
        this.load.image('base_blue_1_2', 'assets/images/Blue_1_2.png');
        this.load.image('base_blue_2_2', 'assets/images/Blue_2_2.png');
        this.load.image('base_orange_1_1', 'assets/images/Orange_1_1.png');
        this.load.image('base_orange_2_1', 'assets/images/Orange_2_1.png');
        this.load.image('base_orange_1_2', 'assets/images/Orange_1_2.png');
        this.load.image('base_orange_2_2', 'assets/images/Orange.png_2_2');

        this.load.image('light_off', 'assets/images/light_off.png');
        this.load.image('light_on', 'assets/images/light_on.png');
        this.load.image('light_overlay', 'assets/images/light_overlay.png');
        this.load.image('power_on', 'assets/images/power_on.png');
        this.load.image('stopper_off', 'assets/images/stopper_off.png');
        this.load.image('stopper_on', 'assets/images/stopper_on.png');
        this.load.image('connector_plus', 'assets/images/ConnectorPlus.png');
        this.load.image('connector_minus', 'assets/images/ConnectorMinus.png');
    }

    create() {
        console.log("Preloading succeeded")
        this.scene.launch("PlayScene")

    }
}
