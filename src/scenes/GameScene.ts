import Phaser from 'phaser';


export default class GameScene extends Phaser.Scene {

    constructor() {
        super({key: 'GameScene', active: true});
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
        this.load.image('light_off', 'assets/images/Light_Off.png');
        this.load.image('light_on', 'assets/images/Light_On.png');
        this.load.image('power_off', 'assets/images/Energy_Source_Off.png');
        this.load.image('power_on', 'assets/images/Energy_Source_On.png');
        this.load.image('switch_off', 'assets/images/Switch_Off.png');
        this.load.image('switch_on', 'assets/images/Switch_On.png');
        this.load.image('toggle_off', 'assets/images/Toggler_Off.png');
        this.load.image('toggle_on', 'assets/images/Toggler_On.png');
    }

    create() {
        console.log("Preloading succeeded")
        this.scene.launch("PlayScene")

    }
}
