import Phaser from 'phaser';
import {GAME_HEIGHT, GAME_WIDTH, ITEM_FONT} from "../index";
import {TextButton} from "../gameobjects/TextButton";

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({key: 'TitleScene'});
    }

    create() {
        const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT + 100, 'All Lights On', {
            fontFamily: ITEM_FONT,
            fontSize: '100px',
            color: '#fff'
        }).setOrigin(0.5);

        const startButton = new TextButton(this,
            GAME_WIDTH / 2, GAME_HEIGHT + 200,
            400, 100,
            'Start Game',
            () => {
                this.fadeOut(title, startButton, optionsButton, () => {
                    this.scene.start('LevelSelectScene');
                })
            });

        const optionsButton = new TextButton(this,
            GAME_WIDTH / 2, GAME_HEIGHT + 300,
            250, 100,
            'Options',
            () => {
                this.scene.start('OptionsScene');
            }
        );

        this.fadeIn(title, startButton, optionsButton);
    }

    private fadeIn(title: Phaser.GameObjects.Text, startButton: TextButton, optionsButton: TextButton) {
        this.tweens.add({
            targets: title,
            y: 300,
            duration: 1000,
            ease: 'Power2'
        });

        this.tweens.add({
            targets: startButton,
            y: GAME_HEIGHT / 2,
            duration: 500,
            ease: 'Power2',
            delay: 200
        });

        this.tweens.add({
            targets: optionsButton,
            y: 700,
            duration: 500,
            ease: 'Power2',
            delay: 400
        });
    }

    private fadeOut(title: Phaser.GameObjects.Text, startButton: TextButton, optionsButton: TextButton, callback: () => void) {
        this.tweens.add({
            targets: optionsButton,
            y: GAME_HEIGHT + 300,
            duration: 1000,
            ease: Phaser.Math.Easing.Quadratic.InOut,

        });

        this.tweens.add({
            targets: startButton,
            y: GAME_HEIGHT + 200,
            duration: 500,
            ease: Phaser.Math.Easing.Quadratic.InOut,
            delay: 200
        });

        this.tweens.add({
            targets: title,
            y: GAME_HEIGHT + 100,
            duration: 500,
            ease: Phaser.Math.Easing.Quadratic.InOut,
            delay: 400,
            onComplete: callback
        });
    }
}