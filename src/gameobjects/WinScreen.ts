import Phaser from 'phaser';
import {GAME_WIDTH, GAME_HEIGHT} from '../index';
import {DEPTHS} from "../Helpers/Depths";

export class WinScreen extends Phaser.GameObjects.Container {
    constructor(scene: Phaser.Scene, nextLevel?: number) {
        super(scene, GAME_WIDTH / 2, GAME_HEIGHT + 200);

        // Add a nine-patch image as the background
        const background = scene.rexUI.add.ninePatch2(0, 0, 800, 200, 'base_white', {
            columns: [40, undefined, 40],
            rows: [40, undefined, 40]
        });
        background.setOrigin(0.5, 0.5);
        this.add(background);

        // Add win text
        const winText = scene.add.text(0, 0, "You won!", {
            fontFamily: "ItemFont",
            fontSize: 60,
            color: "#000000"
        });
        winText.setOrigin(0.5, 0.5);
        this.add(winText);

        if (nextLevel !== undefined) {
            // Add "Next Level" button
            const nextLevelButton = scene.add.text(300, 0, "Next Level", {
                fontFamily: "ItemFont",
                fontSize: 40,
                color: "#0000FF"
            }).setInteractive();
            nextLevelButton.setOrigin(0.5, 0.5);
            nextLevelButton.on('pointerdown', () => {
                scene.scene.restart({level: nextLevel});
            });
            this.add(nextLevelButton);
        }

        // Add "Return to Level Selection" button
        const returnButton = scene.add.text(-300, 0, "Level Selection", {
            fontFamily: "ItemFont",
            fontSize: 40,
            color: "#0000FF"
        }).setInteractive();
        returnButton.setOrigin(0.5, 0.5);
        returnButton.on('pointerdown', () => {
            scene.scene.start('LevelSelectScene');
        });
        this.add(returnButton);

        // Set depth to ensure it is above all other elements
        this.setDepth(DEPTHS.WIN_SCREEN);

        scene.add.existing(this);
    }

    fadeIn() {
        // Animate the win screen to blend in from below
        this.scene.tweens.add({
            targets: this,
            y: GAME_HEIGHT - 200,
            duration: 400,
            ease: Phaser.Math.Easing.Back.InOut
        });
    }
}