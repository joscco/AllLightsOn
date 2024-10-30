import Phaser from 'phaser';
import {Light} from "../gameobjects/Light";
import {PowerSource} from "../gameobjects/PowerSource";
import {Switch} from "../gameobjects/Switch";
import {GAME_HEIGHT, GAME_WIDTH} from "../config";
import {Grid} from "../gameobjects/Grid";
import {Vec2, vec2Equals} from "../Helpers/Dict";
import {Connection} from "../gameobjects/Connection";
import Vector2 = Phaser.Math.Vector2;
import Layer = Phaser.GameObjects.Layer;


export default class GameScene extends Phaser.Scene {
    private powerSources: PowerSource[];
    private lightBulbs: Light[];
    private connections: Connection[];
    private connectionLayer?: Layer;
    private itemLayer?: Layer

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
        var gridLayer = this.add.layer(grid)
        gridLayer.setDepth(0)

        this.connectionLayer = this.add.layer()
        this.connectionLayer.setDepth(1)

        this.itemLayer = this.add.layer()
        this.itemLayer.setDepth(2)

        const power = new PowerSource(this);
        this.powerSources.push(power);
        this.itemLayer.add(power)


        const switcher = new Switch(this, false);
        this.itemLayer.add(switcher)

        switcher.setInteractive({draggable: true})
        var switcherTime = 0
        var connection: Connection
        var switcherPath: Vec2[];

        switcher.on('pointerdown', (pointer: Vector2) => {
            switcherTime = this.time.now
            connection = new Connection(this)
            this.connectionLayer?.add(connection)
            switcherPath = [grid.getIndexForPosition(pointer)]
        })

        switcher.on('drag', (pointer: Vector2) => {
            var indexForPointer = grid.getIndexForPosition(pointer)
            var previousOccurenceInPath = switcherPath.findIndex(index => vec2Equals(index, indexForPointer))
            var lastIndex = switcherPath.at(-1)!
            if (vec2Equals(indexForPointer, lastIndex)) {
                return
                // Allow more steps back here
            } else if (previousOccurenceInPath > -1) {
                switcherPath = switcherPath.slice(0, Math.max(previousOccurenceInPath + 1, 1))
            } else if (Math.abs(indexForPointer.x - lastIndex.x) + Math.abs(indexForPointer.y - lastIndex.y) == 1) {
                switcherPath.push(indexForPointer)
            } else {
                // Add stupidest path
                var curX = lastIndex.x
                var curY = lastIndex.y
                while (curX != indexForPointer.x) {
                    curX = this.oneIntoDirectionOf(curX, indexForPointer.x)
                    switcherPath.push({x: curX, y: curY})
                }
                while (curY != indexForPointer.y) {
                    curY = this.oneIntoDirectionOf(curY, indexForPointer.y)
                    switcherPath.push({x: curX, y: curY})
                }
            }

            connection.setPath(switcherPath)
            connection.draw(grid);
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
        this.itemLayer.add(switcher2)
        switcher2.setInteractive()
        switcher2.on('pointerdown', () => {
            switcher2.setOn(!switcher2.isOn())
            this.checkSources()
        })

        const light = new Light(this, false);
        const light2 = new Light(this, false);
        this.itemLayer.add([light, light2])
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

    private oneIntoDirectionOf(from: number, to: number) {
        if (from < to) {
            return from + 1
        }
        if (from > to) {
            return from - 1
        }
        return from
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
