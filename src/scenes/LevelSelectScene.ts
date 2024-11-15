import Phaser from 'phaser';
import {GAME_WIDTH} from "../index";
import {LEVEL_DATA} from "../levels/LevelConfig";
import {TextButton} from "../gameobjects/TextButton";

export default class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelSelectScene' });
    }

    create() {
        this.add.text(GAME_WIDTH/2, 100, 'Select Level', { fontFamily: 'ItemFont', fontSize: '64px', color: '#fff' }).setOrigin(0.5);

        // Example buttons for levels
        for (let i = 0; i < LEVEL_DATA.length; i++) {
            this.createLevelButton(i + 1, 250 + i * 130);
        }
    }

    createLevelButton(level: number, y: number) {
        const button = new TextButton(this, GAME_WIDTH/2, y, 250, 100, `Level ${level}`, () => {
            this.scene.start('PlayScene', {level});
        });
    }
}