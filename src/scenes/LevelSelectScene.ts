import Phaser from 'phaser';
import {GAME_WIDTH} from "../index";

export default class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelSelectScene' });
    }

    create() {
        this.add.text(GAME_WIDTH/2, 100, 'Select Level', { fontSize: '64px', color: '#fff' }).setOrigin(0.5);

        // Example buttons for levels
        this.createLevelButton(1, 200);
        this.createLevelButton(2, 300);
        this.createLevelButton(3, 400);
        this.createLevelButton(4, 500);
        this.createLevelButton(5, 600);
        this.createLevelButton(6, 700);
        // Add more buttons as needed
    }

    createLevelButton(level: number, y: number) {
        const button = this.add.text(GAME_WIDTH/2, y, `Level ${level}`, { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
        button.setInteractive();
        button.on('pointerdown', () => {
            this.scene.start('PlayScene', { level });
        });
    }
}