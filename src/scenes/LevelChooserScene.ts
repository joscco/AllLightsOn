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


export default class LevelChooserScene extends Phaser.Scene {

    constructor() {
        super({key: 'LevelChooserScene'});
    }

    preload() {
    }

    create() {

    }
}
