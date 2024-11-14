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
        this.load.image('base_orange_2_2', 'assets/images/Orange_2_2.png');

        this.load.image('power_on', 'assets/images/power_on.png');
        this.load.image('light_off', 'assets/images/light_off.png');
        this.load.image('light_on', 'assets/images/light_on.png');
        this.load.image('light_overlay', 'assets/images/light_overlay.png');
        this.load.image('stopper_off', 'assets/images/stopper_left_off.png');
        this.load.image('stopper_on', 'assets/images/stopper_right_on.png');
        this.load.image('switch_up_off', 'assets/images/switch_up_off.png');
        this.load.image('switch_up_on', 'assets/images/switch_up_on.png');
        this.load.image('switch_down_off', 'assets/images/switch_down_off.png');
        this.load.image('switch_down_on', 'assets/images/switch_down_on.png');

        this.load.image('connector_plus', 'assets/images/ConnectorPlus.png');
        this.load.image('connector_minus', 'assets/images/ConnectorMinus.png');

        this.load.json('level1', 'assets/levels/level1.json');
        this.load.json('level2', 'assets/levels/level2.json');
        this.load.json('level3', 'assets/levels/level3.json');
        this.load.json('level4', 'assets/levels/level4.json');
        this.load.json('level5', 'assets/levels/level5.json');
        this.load.json('level6', 'assets/levels/level6.json');
    }

    create() {
        console.log("Preloading succeeded")
        this.scene.launch("TitleScene")
    }
}
