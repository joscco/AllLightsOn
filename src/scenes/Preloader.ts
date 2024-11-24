import Phaser from 'phaser';
import Text = Phaser.GameObjects.Text;
import {GAME_HEIGHT, GAME_WIDTH, ITEM_FONT} from "../index";
import Tween = Phaser.Tweens.Tween;


export default class Preloader extends Phaser.Scene {

    private loadingText?: Text
    private scaleTween?: Tween;

    constructor() {
        super({key: 'Preloader', active: true});
    }

    preload() {
        this.loadingText = this.add.text(
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            'Loading...\n',
            {fontFamily: ITEM_FONT, fontSize: '32px', color: '#fff'});
        this.loadingText.setOrigin(0.5);
        this.loadingText.setAlign('center');
        this.loadingText.setAlpha(0);

        this.load.on('progress', (value: number) => {
            this.updateLoadingText(value);
            this.loadingText?.setAlpha(value)
        });

        this.load.image('base_blue_1_1', 'assets/images/Blue_1_1.png');
        this.load.image('base_blue_2_1', 'assets/images/Blue_2_1.png');
        this.load.image('base_blue_1_2', 'assets/images/Blue_1_2.png');
        this.load.image('base_blue_2_2', 'assets/images/Blue_2_2.png');
        this.load.image('base_orange_1_1', 'assets/images/Orange_1_1.png');
        this.load.image('base_orange_2_1', 'assets/images/Orange_2_1.png');
        this.load.image('base_orange_1_2', 'assets/images/Orange_1_2.png');
        this.load.image('base_orange_2_2', 'assets/images/Orange_2_2.png');
        this.load.image('base_white', 'assets/images/back_white.png');

        this.load.image('light_off', 'assets/images/light_off.png');
        this.load.image('light_on', 'assets/images/light_on.png');
        this.load.image('light_overlay', 'assets/images/light_overlay.png');
        this.load.image('power_on', 'assets/images/power_on.png');
        this.load.image('electron', 'assets/images/electron.png');

        this.load.image('stopper_off', 'assets/images/stopper_left_off.png');
        this.load.image('stopper_on', 'assets/images/stopper_right_on.png');
        this.load.image('switch_up_off', 'assets/images/switch_up_off.png');
        this.load.image('switch_up_on', 'assets/images/switch_up_on.png');
        this.load.image('switch_down_off', 'assets/images/switch_down_off.png');
        this.load.image('switch_down_on', 'assets/images/switch_down_on.png');

        this.load.image('connector_plus', 'assets/images/ConnectorPlus.png');
        this.load.image('connector_minus', 'assets/images/ConnectorMinus.png');

        this.load.image('button_home', 'assets/images/Button_Home.png');
        this.load.image('button_retry', 'assets/images/Button_Back.png');
        this.load.image('button_options', 'assets/images/Button_Options.png');
    }

    create() {
        this.scaleTween?.destroy();
        this.scaleTween = this.tweens.add({
            targets: this.loadingText,
            alpha: 0,
            duration: 500,
            ease: Phaser.Math.Easing.Quadratic.InOut,
            onComplete: () => {
                this.scene.launch("TitleScene")
            },
            onCompleteScope: this
        });
    }

    private updateLoadingText(value: number) {
        this.loadingText?.setText(`Loading...\n ${Math.floor(value * 100)}%`);
    }
}
