import Phaser from 'phaser';
import PlayScene from './scenes/PlayScene';
import Preloader from "./scenes/Preloader";
import LevelChooserScene from "./scenes/LevelChooserScene";
import GameConfig = Phaser.Types.Core.GameConfig;
import RexUIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin.js";
export const GAME_WIDTH = 1080;
export const GAME_HEIGHT = 1080;

export const GAME_CONFIG: GameConfig = {
    type: Phaser.AUTO,
    parent: 'game',
    transparent: true,
    roundPixels: false,
    plugins: {
        scene: [{
            key: 'rexUI',
            plugin: RexUIPlugin,
            mapping: 'rexUI'
        }]
    },
    scale: {
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [Preloader, PlayScene, LevelChooserScene]
};
new Phaser.Game(GAME_CONFIG)
