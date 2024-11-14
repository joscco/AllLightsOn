import Phaser from 'phaser';
import {GAME_WIDTH} from "../index";

export default class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }

    create() {
        let heading = this.add.text(GAME_WIDTH/2, 300, 'My Game Title', { fontSize: '64px', color: '#fff' })
        heading.setOrigin(0.5);

        const startButton = this.add.text(GAME_WIDTH/2, 400, 'Start Game', { fontSize: '32px', color: '#fff' })
        startButton.setOrigin(0.5);
        startButton.setInteractive();
        startButton.on('pointerdown', () => {
            this.scene.start('LevelSelectScene');
        });

        const optionsButton = this.add.text(GAME_WIDTH/2, 500, 'Options', { fontSize: '32px', color: '#fff' })
        optionsButton.setOrigin(0.5);
        optionsButton.setInteractive();
        optionsButton.on('pointerdown', () => {
            this.scene.start('OptionsScene');
        });
    }
}