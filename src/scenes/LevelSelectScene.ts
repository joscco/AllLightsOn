import Phaser from 'phaser';
import {GAME_HEIGHT, GAME_WIDTH} from "../index";
import {LEVEL_DATA} from "../levels/LevelConfig";
import {TextButton} from "../gameobjects/TextButton";
import Text = Phaser.GameObjects.Text;

export default class LevelSelectScene extends Phaser.Scene {
    private title?: Text;
    private buttons?: TextButton[];
    constructor() {
        super({ key: 'LevelSelectScene' });
    }

    create() {
        this.title = this.add.text(GAME_WIDTH / 2, -100, 'Select Level', { fontFamily: 'ItemFont', fontSize: '64px', color: '#fff' }).setOrigin(0.5);

        this.buttons = [];
        for (let i = 0; i < LEVEL_DATA.length; i++) {
            this.buttons.push(this.createLevelButton(i + 1, GAME_HEIGHT + 300));
        }

        this.fadeIn(this.title, this.buttons);
    }

    createLevelButton(level: number, y: number) {
        const button = new TextButton(this, GAME_WIDTH / 2, y, 250, 100, `Level ${level}`, () => {
            this.fadeOut(this.title!, this.buttons!, () => {
                this.scene.start('PlayScene', { level });
            });
        });
        return button;
    }

    private fadeIn(title: Phaser.GameObjects.Text, buttons: TextButton[]) {
        this.tweens.add({
            targets: title,
            y: 100,
            duration: 1000,
            ease: 'Power2'
        });

        buttons.forEach((button, index) => {
            this.tweens.add({
                targets: button,
                y: 250 + index * 130,
                duration: 1000,
                ease: 'Power2',
                delay: 200 + index * 100
            });
        });
    }

    private fadeOut(title: Phaser.GameObjects.Text, buttons: TextButton[], callback: () => void) {
        buttons.forEach((button, index) => {
            this.tweens.add({
                targets: button,
                y: GAME_HEIGHT + 100,
                duration: 1000,
                ease: Phaser.Math.Easing.Quadratic.InOut,
                delay: index * 100
            });
        });

        this.tweens.add({
            targets: title,
            y: -100,
            duration: 1000,
            ease: Phaser.Math.Easing.Quadratic.InOut,
            delay: buttons.length * 100,
            onComplete: callback
        });
    }
}