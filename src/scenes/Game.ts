import Phaser from 'phaser';
import {Light} from "../gameobjects/Light";
import {PowerSource} from "../gameobjects/PowerSource";
import {Switch} from "../gameobjects/Switch";
import {GAME_HEIGHT, GAME_WIDTH} from "../config";
import {Grid} from "../gameobjects/Grid";
import {Vec2, vec2Equals} from "../Helpers/Dict";
import {Connection} from "../gameobjects/Connection";
import {ConnectionPartner} from "../interfaces/ConnectionPartner";
import {Toggle} from "../gameobjects/Toggle";
import Vector2 = Phaser.Math.Vector2;
import Layer = Phaser.GameObjects.Layer;


export default class GameScene extends Phaser.Scene {
    private items: ConnectionPartner[]
    private connections: Connection[];
    private connectionLayer?: Layer;
    private itemLayer?: Layer
    private grid?: Grid

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
        this.load.image('toggle_off', 'assets/Changer_Off.png');
        this.load.image('toggle_on', 'assets/Changer_On.png');
    }

    create() {
        const grid_unit = 40;
        this.grid = new Grid(
            this,
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            30, 20,
            grid_unit, grid_unit)
        this.grid.showGrid()
        var gridLayer = this.add.layer(this.grid)
        gridLayer.setDepth(0)

        this.connectionLayer = this.add.layer()
        this.connectionLayer.setDepth(1)
        this.itemLayer = this.add.layer()
        this.itemLayer.setDepth(2)

        const power = new PowerSource(this);
        const power2 = new PowerSource(this);
        const switcher = new Switch(this, false);
        const switcher2 = new Switch(this, false);
        const light = new Light(this, false);
        const light2 = new Light(this, false);
        const light3 = new Light(this, false);
        const toggle = new Toggle(this, false)

        this.itemLayer.add([power, power2, switcher, switcher2, light, light2, light3, toggle])
        this.items.push(power, power2, switcher, switcher2, light, light2, light3, toggle);

        var dragContainer = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0)
        dragContainer.setInteractive()
        this.defineItemLogic(this.grid);

        this.grid.addAtIndex({x: -5, y: 0}, toggle)
        this.grid.addAtIndex({x: -10, y: -5}, power)
        this.grid.addAtIndex({x: -10, y: 5}, power2)
        this.grid.addAtIndex({x: 0, y: -5}, switcher)
        this.grid.addAtIndex({x: 0, y: 5}, switcher2)
        this.grid.addAtIndex({x: 7, y: -5}, light)
        this.grid.addAtIndex({x: 7, y: 0}, light2)
        this.grid.addAtIndex({x: 7, y: 5}, light3)
    }

    private defineItemLogic(grid: Grid) {
        var dragTime = 0
        var connection: Connection | undefined
        var itemPath: Vec2[];
        var pressed: boolean = false

        this.input.on('pointerdown', (pointer: Vector2) => {
            pressed = true
            var item = this.grid?.getItemAtIndex(this.grid?.getIndexForPosition(pointer))
            if (item) {
                var currentConnectionsForItem = this.getConnectionsForItem(this.connections, item)
                if (currentConnectionsForItem.length < item.getMaxNumberOfConnections()) {
                    dragTime = this.time.now
                    connection = new Connection(this)
                    this.connectionLayer?.add(connection)
                    connection.setStart(item)
                    itemPath = [grid.getIndexForPosition(pointer)]
                } else {
                    // Item can take no more connections
                    item.wiggle()
                }
            }
        })

        this.input.on('pointermove', (pointer: Vector2) => {
            if (pressed && connection) {
                var indexForPointer = grid.getIndexForPosition(pointer)
                var itemAtIndex = grid.getItemAtIndex(indexForPointer)
                itemPath = this.addPointToPath(indexForPointer, itemAtIndex, itemPath, connection);
                var findStartIndex = itemPath.slice().reverse().findIndex(index => {
                    var item = this.grid?.getItemAtIndex(index);
                    return item && item == connection!.getStart()
                })
                itemPath = itemPath.slice(itemPath.length - 1 - findStartIndex)

                var firstEndIndex = itemPath.findIndex(index => {
                    var item = this.grid?.getItemAtIndex(index);
                    return item && item != connection!.getStart()
                })

                if (firstEndIndex > -1) {
                    var itemAtEnd = this.grid?.getItemAtIndex(itemPath.at(firstEndIndex)!)!
                    itemPath = itemPath.slice(0, firstEndIndex + 1)
                    connection.setEnd(itemAtEnd)
                    var itemConnections = this.getConnectionsForItem(this.connections, itemAtEnd)
                    if (itemConnections.length < itemAtEnd.getMaxNumberOfConnections()) {
                        connection.setEnd(itemAtIndex)
                    } else {
                        itemAtIndex?.wiggle()
                        connection.resetEnd()
                    }
                } else {
                    connection.resetEnd()
                }

                connection.setPath(itemPath)
                connection.draw(this.grid!);
            }
        })

        this.input.on('pointerup', (pointer: Vector2) => {
            pressed = false
            var item = this.grid?.getItemAtIndex(this.grid?.getIndexForPosition(pointer))
            if (item && this.time.now - dragTime < 300) {
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
    }

    private addPointToPath(
        indexForPointer: Vec2,
        itemAtIndex: ConnectionPartner | undefined,
        switcherPath: Vec2[],
        connection: Connection): Vec2[] {
        var previousOccurrenceInPath = switcherPath.findIndex(index => vec2Equals(index, indexForPointer))
        if (previousOccurrenceInPath > -1) {
            if (previousOccurrenceInPath == switcherPath.length - 1) {
                // Last occurence is last index, so nothing to do
            } else {
                // Reset
                switcherPath = switcherPath.slice(0, Math.max(previousOccurrenceInPath + 1, 1))
            }
        } else {
            // Add new point
            var lastIndex = switcherPath.at(-1)!
            if (!connection.getEnd() || (itemAtIndex == connection.getEnd())) {
                if (Math.abs(indexForPointer.x - lastIndex.x) + Math.abs(indexForPointer.y - lastIndex.y) == 1) {
                    switcherPath.push(indexForPointer)
                } else {
                    // Add easiest path
                    var curX = lastIndex.x
                    var curY = lastIndex.y
                    while (curX != indexForPointer.x) {
                        curX = this.oneIntoDirectionOf(curX, indexForPointer.x)
                        var newIndex = {x: curX, y: curY}
                        var duplicateIndex = switcherPath.findIndex(index => vec2Equals(index, newIndex))
                        if (duplicateIndex > -1) {
                            switcherPath = switcherPath.slice(0, duplicateIndex)
                        }
                        switcherPath.push(newIndex)
                    }
                    while (curY != indexForPointer.y) {
                        curY = this.oneIntoDirectionOf(curY, indexForPointer.y)
                        var newIndex = {x: curX, y: curY}
                        var duplicateIndex = switcherPath.findIndex(index => vec2Equals(index, newIndex))
                        if (duplicateIndex > -1) {
                            switcherPath = switcherPath.slice(0, duplicateIndex)
                        }
                        switcherPath.push(newIndex)
                    }
                }
            }
        }

        return switcherPath
    }

    private getConnectionsForItem(connections: Connection[], itemAtIndex: ConnectionPartner): Connection[] {
        return connections.filter(connection =>
            connection.getEnd() == itemAtIndex
            || connection.getStart() == itemAtIndex)
    }

    checkSources() {
        this.items.forEach(item => item.reset())
        this.connections.forEach(connection => connection.setInUse(false))
        for (let powerSource of this.items.filter(item => item.isSource())) {
            this.forwardPower(true, powerSource, this.connections);
        }

        if (this.items.filter(item => item.isLightBulb()).every(bulb => (bulb as Light).isOn())) {
            // Blending in Win Screen, unlocking next level
            console.log("WON!")
        }
    }

    private forwardPower(power: boolean, source: ConnectionPartner, connections: Connection[]) {
        // Also non powers have to be forwarded!
        var leftConnections = connections.filter(connection => !connection.isInUse())
        for (let connection of leftConnections) {

            if (connection.getStart() == source || connection.getEnd() == source) {
                connection.alpha = 0.5
                if (power) {
                    connection.alpha = 1
                }

                let otherPartner = [connection.getEnd(), connection.getStart()].find(el => el != source)!
                connection.setInUse(true)
                otherPartner.consume(power)

                // Here are only those relevant that can provide energy!
                var leftIncomingConnections = this.getConnectionsForItem(leftConnections, otherPartner)
                    .map(connection => [connection.getStart(), connection.getEnd()].filter(partner => partner != otherPartner)[0]!)
                    .filter(item => item.isSource() || item.isForwarder())
                var numberOfLeftIncomingConnections = leftIncomingConnections.length - 1

                if (otherPartner.isForwarder() && otherPartner.powerForwardCanBeChecked(numberOfLeftIncomingConnections)) {
                    this.forwardPower(otherPartner.powerAvailableAfter(power), otherPartner, leftConnections)
                }
            }
        }
    }

    private connectionExists(connection : Connection) {
        return this.connections
            .filter(other => (other.getStart() == connection.getStart() && other.getEnd() == connection.getEnd())
                || (other.getStart() == connection.getEnd() && other.getEnd() == connection.getStart()))
            .length > 0
    }

    private  oneIntoDirectionOf(from: number, to: number) {
        if (from < to) {
            return from + 1
        }
        if (from > to) {
            return from - 1
        }
        return from
    }
}
