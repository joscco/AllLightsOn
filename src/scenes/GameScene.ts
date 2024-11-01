import Phaser from 'phaser';
import {Light} from "../gameobjects/Light";
import {PowerSource} from "../gameobjects/PowerSource";
import {Switch} from "../gameobjects/Switch";
import {GAME_HEIGHT, GAME_WIDTH} from "../config";
import {Grid} from "../gameobjects/Grid";
import {Vec2, vec2Copy, vec2Equals} from "../Helpers/Dict";
import {Connection} from "../gameobjects/Connection";
import {ConnectionPartner} from "../interfaces/ConnectionPartner";
import {Toggle} from "../gameobjects/Toggle";
import Vector2 = Phaser.Math.Vector2;
import Layer = Phaser.GameObjects.Layer;


export default class GameScene extends Phaser.Scene {

    constructor() {
        super({key: 'GameScene', active: true});
    }

    preload() {
        this.load.on('progress', (value: number) => {
            console.log(value);
        });

        this.load.on('fileprogress', (file: any) => {
            console.log(file.src);
        });
        this.load.on('complete', function () {
            console.log('complete');
        });
        this.load.image('base_orange', 'assets/Item_Back_Orange.png');
        this.load.image('base_blue', 'assets/Item_Back_Blue.png');
        this.load.image('light_off', 'assets/Light_Off.png');
        this.load.image('light_on', 'assets/Light_On.png');
        this.load.image('power_off', 'assets/Energy_Source_Off.png');
        this.load.image('power_on', 'assets/Energy_Source_On.png');
        this.load.image('switch_off', 'assets/Switch_Off.png');
        this.load.image('switch_on', 'assets/Switch_On.png');
        this.load.image('toggle_off', 'assets/Toggler_Off.png');
        this.load.image('toggle_on', 'assets/Toggler_On.png');
    }

    create() {
        console.log("Preloading succeeded")
        this.scene.launch("PlayScene")

    }
}
