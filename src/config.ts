import Phaser from 'phaser';

export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

export default {
    type: Phaser.AUTO,
    parent: 'game',
    transparent: true,
    scale: {
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};
