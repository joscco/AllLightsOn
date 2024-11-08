import Phaser from 'phaser';
import config from './config';
import PlayScene from './scenes/PlayScene';
import Preloader from "./scenes/Preloader";
import LevelChooserScene from "./scenes/LevelChooserScene";

new Phaser.Game(
  Object.assign(config, {
      scene: [Preloader, PlayScene, LevelChooserScene]
  })
);
