import Phaser from 'phaser';
import {Light} from "../gameobjects/Light";
import {PowerSource} from "../gameobjects/PowerSource";
import {Switch} from "../gameobjects/Switch";
import {GAME_HEIGHT, GAME_WIDTH} from "../config";
import {Grid} from "../gameobjects/Grid";
import {Vec2, vec2Equals} from "../Helpers/Dict";
import {Connection} from "../gameobjects/Connection";
import {ConnectionPartner} from "../interfaces/ConnectionPartner";
import Vector2 = Phaser.Math.Vector2;
import Layer = Phaser.GameObjects.Layer;


export default class GameScene extends Phaser.Scene {
    private items: ConnectionPartner[]
    private connections: Connection[];
    private connectionLayer?: Layer;
    private itemLayer?: Layer

    constructor() {
        super('GameScene');
        this.items = [];
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

        const switcher = new Switch(this, false);
        const switcher2 = new Switch(this, false);
        const light = new Light(this, false);
        const light2 = new Light(this, false);

        this.itemLayer.add([power, switcher, switcher2, light, light2])
        this.items.push(power, switcher, switcher2, light, light2);

        this.items.forEach(item => {
            item.setInteractive({draggable: true})

            var itemTime = 0
            var connection: Connection | undefined
            var itemPath: Vec2[];

            item.on('pointerdown', (pointer: Vector2) => {
                if (this.getConnectionsForItem(this.connections, item) < item.getMaxNumberOfConnections()) {
                    itemTime = this.time.now
                    connection = new Connection(this)
                    this.connectionLayer?.add(connection)
                    connection.setStart(item)
                    itemPath = [grid.getIndexForPosition(pointer)]
                } else {
                    console.log("Max connections reached!")
                }
            })

            item.on('drag', (pointer: Vector2) => {
                if (connection) {
                    itemPath = this.addPointToPath(grid, pointer, itemPath, connection);
                    connection.setPath(itemPath)
                    connection.draw(grid);
                }
            })

            item.on('dragend', () => {
                if (this.time.now - itemTime < 300) {
                    item.onClick()
                    this.checkSources()
                } else if (connection) {
                    if (connection.getStart() && connection.getEnd() && !this.connectionExists(connection)) {
                        this.connections.push(connection)
                        connection = undefined
                        this.checkSources()
                    } else {
                        connection.destroy()
                    }
                }
            })
        })

        grid.addAtIndex({x: -10, y: 0}, power)
        grid.addAtIndex({x: -5, y: 0}, switcher)
        grid.addAtIndex({x: 0, y: 0}, switcher2)
        grid.addAtIndex({x: 5, y: 0}, light)
        grid.addAtIndex({x: 10, y: 0}, light2)
    }

    private addPointToPath(grid: Grid, pointer: Phaser.Math.Vector2, switcherPath: Vec2[], connection: Connection): Vec2[] {
        var indexForPointer = grid.getIndexForPosition(pointer)
        var itemAtIndex = grid.getItemAtIndex(indexForPointer)
        if (itemAtIndex
            && itemAtIndex != connection.getStart()
            && this.getConnectionsForItem(this.connections, itemAtIndex) < itemAtIndex.getMaxNumberOfConnections()) {
            connection.setEnd(itemAtIndex)
        }

        var previousOccurenceInPath = switcherPath.findIndex(index => vec2Equals(index, indexForPointer))
        var lastIndex = switcherPath.at(-1)!
        if (vec2Equals(indexForPointer, lastIndex)) {
            // Do nothing
            return switcherPath
        } else {
            if (previousOccurenceInPath > -1) {
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

            return switcherPath
        }
    }

    private getConnectionsForItem(connections: Connection[], itemAtIndex: ConnectionPartner): number {
        return connections
            .filter(connection => connection.getEnd() == itemAtIndex || connection.getStart() == itemAtIndex)
            .length
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
        this.items.forEach(item => item.reset())
        this.connections.forEach(connection => connection.setInUse(false))
        for (let powerSource of this.items.filter(item => item.isSource())) {
            this.forwardPower(true, powerSource, this.connections);
        }

        if (this.items.filter(item => item.isLightBulb()).every(bulb => (bulb as Light).isOn())) {
            console.log("WON!")
        }
    }

    private forwardPower(power: boolean, source: ConnectionPartner, connections: Connection[]) {
        // Also non powers have to be forwarded!
        var leftConnections = connections.filter(connection => !connection.isInUse())
        for (let connection of leftConnections) {
            if (connection.getStart() == source || connection.getEnd() == source) {
                connection.setInUse(true)
                let otherPartner = [connection.getEnd(), connection.getStart()].find(el => el != source)!
                otherPartner.consume(power)

                var numberOfLeftConnectionsToConsume = this.getConnectionsForItem(leftConnections, otherPartner) - 1

                if (otherPartner.isForwarder() && otherPartner.powerForwardCanBeChecked(numberOfLeftConnectionsToConsume)) {
                    this.forwardPower(otherPartner.powerAvailableAfter(power), otherPartner, leftConnections)
                }
            }
        }
    }

    private connectionExists(connection: Connection) {
        return this.connections
            .filter(other => (other.getStart() == connection.getStart() && other.getEnd() == connection.getEnd())
                || (other.getStart() == connection.getEnd() && other.getEnd() == connection.getStart()))
            .length > 0
    }
}
