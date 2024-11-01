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


export default class PlayScene extends Phaser.Scene {
    private items: ConnectionPartner[]
    private connections: Connection[];
    private connectionLayer?: Layer;
    private itemLayer?: Layer
    private grid?: Grid

    constructor() {
        super({key: 'PlayScene'});
        this.items = [];
        this.connections = [];
    }

    create() {
        const GRID_UNIT_SIZE = 40;
        this.grid = new Grid(
            this,
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            24, 16,
            GRID_UNIT_SIZE, GRID_UNIT_SIZE)
        this.grid.showGrid()
        let gridLayer = this.add.layer(this.grid)
        gridLayer.setDepth(0)

        this.connectionLayer = this.add.layer()
        this.connectionLayer.setDepth(2)
        this.itemLayer = this.add.layer()
        this.itemLayer.setDepth(1)

        const power = new PowerSource(this, GRID_UNIT_SIZE);
        const power2 = new PowerSource(this, GRID_UNIT_SIZE);
        const switcher = new Switch(this, false, GRID_UNIT_SIZE);
        const switcher2 = new Switch(this, false, GRID_UNIT_SIZE);
        const light = new Light(this, false, GRID_UNIT_SIZE);
        const light2 = new Light(this, false, GRID_UNIT_SIZE);
        const light3 = new Light(this, false, GRID_UNIT_SIZE);
        const toggle = new Toggle(this, false, GRID_UNIT_SIZE)

        this.itemLayer.add([power, power2, switcher, switcher2, light, light2, light3, toggle])
        this.items.push(power, power2, switcher, switcher2, light, light2, light3, toggle);

        let dragContainer = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0xffffff, 0)
        dragContainer.setInteractive()
        this.defineItemLogic(this.grid);

        this.grid.addAtIndex({x: -5, y: 0}, toggle)
        this.grid.addAtIndex({x: -10, y: -5}, power)
        this.grid.addAtIndex({x: -10, y: 5}, power2)
        this.grid.addAtIndex({x: 0, y: -5}, switcher)
        this.grid.addAtIndex({x: 0, y: -2}, switcher2)
        this.grid.addAtIndex({x: 7, y: -5}, light)
        this.grid.addAtIndex({x: 7, y: 0}, light2)
        this.grid.addAtIndex({x: 7, y: 5}, light3)
    }

    update(time: number, delta: number) {
        this.connections.forEach(con => con.update(time))
    }

    private defineItemLogic(grid: Grid) {
        let dragTime = 0
        let connection: Connection | undefined
        let itemPath: Vec2[];
        let pressed: boolean = false

        this.input.on('pointerdown', (pointer: Vector2) => {
            pressed = true
            let item = this.grid?.getItemAtIndex(this.grid?.getIndexForPosition(pointer))
            if (item) {
                let currentConnectionsForItem = this.getConnectionsForItem(this.connections, item)
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
                let indexForPointer = grid.getIndexForPosition(pointer)

                // Calculate path without checking
                itemPath = this.addPointToPath(indexForPointer, itemPath, connection);
                let findStartIndex = itemPath.slice().reverse().findIndex(index => {
                    let item = this.grid?.getItemAtIndex(index);
                    return item && item == connection!.getStart()
                })

                itemPath = itemPath.slice(itemPath.length - 1 - findStartIndex)
                let firstEndIndex = itemPath.findIndex(index => {
                    let item = this.grid?.getItemAtIndex(index);
                    return item && item != connection!.getStart()
                })

                if (firstEndIndex > -1) {
                    let itemAtEnd = this.grid?.getItemAtIndex(itemPath.at(firstEndIndex)!)!
                    itemPath = itemPath.slice(0, firstEndIndex + 1)
                    connection.setEnd(itemAtEnd)
                    let itemConnections = this.getConnectionsForItem(this.connections, itemAtEnd)
                    if (itemConnections.length < itemAtEnd.getMaxNumberOfConnections()) {
                        connection.setEnd(itemAtEnd)
                    } else {
                        itemAtEnd?.wiggle()
                        connection.resetEnd()
                    }
                } else {
                    connection.resetEnd()
                }

                let posPath = this.grid!.calculatePosPathFromIndices(itemPath)
                connection.setPath(posPath)
                connection.draw();
            }
        })

        this.input.on('pointerup', (pointer: Vector2) => {
            pressed = false
            let item = this.grid?.getItemAtIndex(this.grid?.getIndexForPosition(pointer))
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
        switcherPath: Vec2[],
        connection: Connection): Vec2[] {
        let previousOccurrenceInPath = switcherPath.findIndex(index => vec2Equals(index, indexForPointer))
        if (previousOccurrenceInPath > -1) {
            if (previousOccurrenceInPath != switcherPath.length - 1) {
                // if last occurence was last index, there would be nothing to do
                // otherwise reset path to last occurence
                switcherPath = switcherPath.slice(0, Math.max(previousOccurrenceInPath + 1, 1))
            }
        } else {
            // Add new point
            let lastIndex = switcherPath.at(-1)!
            if (!connection.getEnd()) {
                if (Math.abs(indexForPointer.x - lastIndex.x) + Math.abs(indexForPointer.y - lastIndex.y) == 1) {
                    switcherPath.push(indexForPointer)
                } else {
                    // Add trivial connection path
                    switcherPath = this.calculateLinkingPath(switcherPath, indexForPointer)
                }
            }
        }

        return switcherPath
    }

    calculateLinkingPath(previousPath: Vec2[], end: Vec2): Vec2[] {
        let result: Vec2[] = previousPath.map(vec2Copy)
        let start = previousPath.at(-1)!
        let curX = start.x
        let curY = start.y
        while (curX != end.x) {
            curX = this.oneIntoDirectionOf(curX, end.x)
            let newIndex = {x: curX, y: curY}
            let duplicateIndex = result.findIndex(index => vec2Equals(index, newIndex))
            if (duplicateIndex > -1) {
                result = result.slice(0, duplicateIndex)
            }
            result.push(newIndex)
        }
        while (curY != end.y) {
            curY = this.oneIntoDirectionOf(curY, end.y)
            let newIndex = {x: curX, y: curY}
            let duplicateIndex = result.findIndex(index => vec2Equals(index, newIndex))
            if (duplicateIndex > -1) {
                result = result.slice(0, duplicateIndex)
            }
            result.push(newIndex)
        }
        return result
    }

    private getConnectionsForItem(connections: Connection[], itemAtIndex: ConnectionPartner): Connection[] {
        return connections.filter(connection =>
            connection.getEnd() == itemAtIndex
            || connection.getStart() == itemAtIndex)
    }

    checkSources() {
        this.items.forEach(item => item.reset())
        this.connections.forEach(connection => connection.setDirectedWithPower(false))

        for (let powerSource of this.items.filter(item => item.isPowerSource())) {
            this.forwardPower(powerSource, this.connections);
        }

        if (this.items.filter(item => item.isLightBulb()).every(bulb => (bulb as Light).isOn())) {
            // Blending in Win Screen, unlocking next level
            console.log("WON!")
        }
    }

    private forwardPower(source: ConnectionPartner, connections: Connection[]) {
        // Also non powers have to be forwarded!
        let leftUndirectedConnections = connections
            .filter(connection => !connection.isDirectedWithPower())
        for (let connection of leftUndirectedConnections) {
            // if (connection.hasPartner(source)) { // This is undirected
            if (connection.getStart() == source) {
                let otherPartner = connection.getPartnerThatIsNot(source)
                connection.setDirectedWithPower(true, source, otherPartner)
                otherPartner.consume()

                // We need to check here how much power is supplied
                // Here are only those relevant that can provide energy!
                // let leftIncomingUndirectedConnectionsToOther = this.getConnectionsForItem(leftUndirectedConnections, otherPartner)
                //     .map(connection => connection.getPartnerThatIsNot(otherPartner))
                //     .filter(item => item.isPowerSource() || item.isPowerForwarder())
                // let numberOfLeftIncomingConnections = leftIncomingUndirectedConnectionsToOther.length - 1

                if (otherPartner.isPowerForwarder()) { // && otherPartner.powerForwardCanBeChecked(numberOfLeftIncomingConnections)) {
                    let powerProvidedAfter = otherPartner.powerAvailableAfter()
                    if (powerProvidedAfter) {
                        this.forwardPower(otherPartner, leftUndirectedConnections)
                    }
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

    private oneIntoDirectionOf(from: number, to: number) {
        if (from < to) {
            return from + 1
        }
        if (from > to) {
            return from - 1
        }
        return from
    }
}
