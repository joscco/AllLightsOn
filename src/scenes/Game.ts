import Phaser from 'phaser';
import {Light} from "../gameobjects/Light";
import {PowerSource} from "../gameobjects/PowerSource";
import {Switch} from "../gameobjects/Switch";
import {GAME_HEIGHT, GAME_WIDTH} from "../config";
import {Grid} from "../gameobjects/Grid";
import {Vec2, vec2Equals, vec2Mean} from "../Helpers/Dict";
import Vector2 = Phaser.Math.Vector2;
import Line = Phaser.Curves.Line;
import Path = Phaser.Curves.Path;
import QuadraticBezier = Phaser.Curves.QuadraticBezier;
import {Connection} from "../gameobjects/Connection";


export default class GameScene extends Phaser.Scene {
    private powerSources: PowerSource[];
    private lightBulbs: Light[];
    private connections: Connection[];

    constructor() {
        super('GameScene');
        this.powerSources = [];
        this.lightBulbs = [];
        this.connections = [];
    }

    preload() {
        this.load.image('light_off', 'assets/Light_Off.png');
        this.load.image('light_on', 'assets/Light_On.png');
        this.load.image('power_off', 'assets/Energy_Source_Off.png');
        this.load.image('power_on', 'assets/Energy_Source_On.png');
        this.load.image('switch_off', 'assets/Switch_Off.png');
        this.load.image('switch_on', 'assets/Switch_On.png');
    }

    create() {
        const grid_unit = 40;
        var grid = new Grid(
            this,
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            20, 20,
            grid_unit, grid_unit)
        grid.showGrid()

        const power = new PowerSource(this);
        this.powerSources.push(power);


        const switcher = new Switch(this, false);
        switcher.setInteractive({draggable: true})
        var switcherTime = 0
        var connection: Connection
        var switcherPath: Vec2[];

        switcher.on('pointerdown', (pointer: Vector2) => {
            switcherTime = this.time.now
            connection = new Connection(this)
            switcherPath = [grid.getIndexForPosition(pointer)]
        })

        switcher.on('drag', (pointer: Vector2) => {
            if (this.time.now - switcherTime > 300) {
                var indexForPointer = grid.getIndexForPosition(pointer)
                var previousOccurenceInPath = switcherPath.findIndex(index => vec2Equals(index, indexForPointer))
                var lastIndex = switcherPath.at(-1)!
                if (vec2Equals(indexForPointer, lastIndex)) {
                    return
                    // Allow more steps back here
                } else if (previousOccurenceInPath > -1) {
                    switcherPath = switcherPath.slice(0, Math.max(previousOccurenceInPath, 1))
                } else if (Math.abs(lastIndex.x - indexForPointer.x) + Math.abs(lastIndex.y - indexForPointer.y) == 1) {
                    switcherPath.push(indexForPointer)
                }

                connection.setPath(switcherPath)
                connection.draw(grid);
            }
        })

        switcher.on('dragend', () => {
            if (this.time.now - switcherTime < 300) {
                switcher.setOn(!switcher.isOn())
                this.checkSources()
            } else {
                connection.destroy()
            }

        })


        const switcher2 = new Switch(this, false);
        switcher2.setInteractive()
        switcher2.on('pointerdown', () => {
            switcher2.setOn(!switcher2.isOn())
            this.checkSources()
        })

        const light = new Light(this, false);
        const light2 = new Light(this, false);
        this.lightBulbs.push(light, light2);

        power.addConsumer(switcher)
        switcher.addConsumer(switcher2)
        switcher2.addConsumer(light)
        switcher2.addConsumer(light2)

        grid.addAtIndex({x: -10, y: 0}, power)
        grid.addAtIndex({x: -5, y: 0}, switcher)
        grid.addAtIndex({x: 0, y: 0}, switcher2)
        grid.addAtIndex({x: 5, y: 0}, light)
        grid.addAtIndex({x: 10, y: 0}, light2)
    }

    checkSources() {
        for (let powerSource of this.powerSources) {
            powerSource.supply(true);
        }

        if (this.lightBulbs.every(bulb => bulb.isOn())) {
            console.log("WON!")
        }
    }
}
