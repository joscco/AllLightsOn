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

        this.load.image('base_orange', 'assets/images/Item_Back_Orange.png');
        this.load.image('base_blue', 'assets/images/Item_Back_Blue.png');
        this.load.image('light_off', 'assets/images/light_off.png');
        this.load.image('light_on', 'assets/images/light_on.png');
        this.load.image('light_overlay', 'assets/images/light_overlay.png');
        this.load.image('power_on', 'assets/images/power_on.png');
        this.load.image('switch_off', 'assets/images/Switch_Off.png');
        this.load.image('switch_on', 'assets/images/Switch_On.png');
        this.load.image('connector_plus', 'assets/images/ConnectorPlus.png');
        this.load.image('connector_minus', 'assets/images/ConnectorMinus.png');
    }

    create() {
        console.log("Preloading succeeded")
        this.scene.launch("PlayScene")

    }
}
