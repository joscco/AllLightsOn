import Phaser from 'phaser';

export default class OptionsScene extends Phaser.Scene {
    constructor() {
        super({ key: 'OptionsScene' });
    }

    create() {
        this.add.text(400, 300, 'Options', { fontSize: '64px', color: '#fff' }).setOrigin(0.5);
        // Add volume controls and other options here

        this.add.text(400, 500, 'Press ESC to go back', { fontSize: '32px', color: '#fff' }).setOrigin(0.5);
        this.input.on('keydown-ESC', () => {
            this.scene.start('TitleScene');
        });
    }
}