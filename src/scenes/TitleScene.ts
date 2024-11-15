import Phaser from 'phaser';
import {GAME_HEIGHT, GAME_WIDTH, ITEM_FONT} from "../index";
import {TextButton} from "../gameobjects/TextButton";

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({key: 'TitleScene'});
    }

    create() {
        this.add.text(GAME_WIDTH / 2, 300, 'All Lights On', {
            fontFamily: ITEM_FONT,
            fontSize: '100px',
            color: '#fff'
        }).setOrigin(0.5);

        const startButton = new TextButton(this,
            GAME_WIDTH / 2, GAME_HEIGHT/2,
            400, 100,
            'Start Game',
            () => {
                this.scene.start('LevelSelectScene')
            })

        // Use a text button here too

        const optionsButton = new TextButton(this,
            GAME_WIDTH / 2, 700,
            250, 100,
            'Options',
            () => {this.scene.start('OptionsScene');}
        );
    }
}