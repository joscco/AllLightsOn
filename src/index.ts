import Phaser from 'phaser';
import config from './config';
import PlayScene from './scenes/PlayScene';
import GameScene from "./scenes/GameScene";
import LevelChooserScene from "./scenes/LevelChooserScene";

new Phaser.Game(
  Object.assign(config, {
      scene: [GameScene, PlayScene, LevelChooserScene]
  })
);
