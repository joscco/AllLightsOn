import Phaser from 'phaser';
import {Light} from "../gameobjects/Light";
import {PowerSource} from "../gameobjects/PowerSource";
import {Switch} from "../gameobjects/Switch";
import {GAME_HEIGHT, GAME_WIDTH} from "../config";
import {Grid} from "../gameobjects/Grid";
import {Connection} from "../gameobjects/Connection";
import {ConnectionPartner} from "../interfaces/ConnectionPartner";
import {Vec2, vec2Copy, vec2Equals} from "../Helpers/VecMath";
import {And} from "../gameobjects/And";
import Vector2 = Phaser.Math.Vector2;
import {Or} from "../gameobjects/Or";


export default class PlayScene extends Phaser.Scene {
    private static GRID_UNIT_SIZE = 40
    private grid?: Grid

    constructor() {
        super({key: 'PlayScene'})
    }

    create() {
        this.grid = new Grid(
            this,
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            24, 16,
            PlayScene.GRID_UNIT_SIZE, PlayScene.GRID_UNIT_SIZE)
        this.grid.showGrid()
        let dragContainer = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0, 0)
        dragContainer.setInteractive()
        this.defineItemLogic();

        this.grid.addItemAtIndex({x: -10, y: -5}, new PowerSource(this))
        this.grid.addItemAtIndex({x: -10, y: 0}, new PowerSource(this))
        this.grid.addItemAtIndex({x: -10, y: 5}, new PowerSource(this))
        this.grid.addItemAtIndex({x: -5, y: -5}, new Switch(this, false))
        this.grid.addItemAtIndex({x: -5, y: 0}, new Switch(this, false))
        this.grid.addItemAtIndex({x: -5, y: 5}, new Switch(this, false))
        this.grid.addItemAtIndex({x: 0, y: 0}, new Or(this))
        this.grid.addItemAtIndex({x: 5, y: 0}, new Light(this, false))
    }

    update(time: number) {
        this.grid!.getConnections().forEach(con => con.update(time))
    }

    private defineItemLogic() {
        let dragTime = 0
        let connection: Connection | undefined
        let indexPath: Vec2[];
        let pressed: boolean = false

        this.input.on('pointerdown', (pointer: Vector2) => {
            pressed = true
            let index = this.grid!.getIndexForPosition(pointer)
            let item = this.grid!.getItemAtIndex(index)
            dragTime = this.time.now
            if (item) {
                let currentConnectionsForItem = this.grid!.getConnectionsFor(item)
                if (currentConnectionsForItem.length < item.getNumberOfInputs() + item.getNumberOfOutputs()) {
                    connection = new Connection(this)
                    this.grid!.addConnectionToLayer(connection)
                    connection.setStart(item)
                    indexPath = [this.grid!.getIndexForPosition(pointer)]
                }
            }
        })

        this.input.on('pointermove', (pointer: Vector2) => {
            if (pressed && connection) {
                let indexForPointer = this.grid!.getIndexForPosition(pointer)

                // Calculate path without checking
                indexPath = this.addPointToPath(indexForPointer, indexPath, connection);
                let startIndex = indexPath.slice().reverse().findIndex(index => {
                    let connector = this.grid!.getConnectorAtIndex(index);
                    return connector && connector.partner == connection!.getStart()
                })

                if (startIndex > -1) {
                    indexPath = indexPath.slice(indexPath.length - 1 - startIndex)

                    let firstInvalidIndex = indexPath.findIndex(index => {
                        let connector = this.grid!.getConnectorAtIndex(index);
                        return !connector && this.grid!.getItemAtIndex(index)
                    })
                    if (firstInvalidIndex > -1) {
                        indexPath = indexPath.slice(0, firstInvalidIndex)
                    }

                    let firstEndIndex = indexPath.findIndex(index => {
                        let connector = this.grid!.getConnectorAtIndex(index);
                        return connector && connector.partner != connection!.getStart()
                    })
                    if (firstEndIndex > -1) {
                        // Start and End found, now check if feasible connectors exist
                        let itemAtStart = this.grid?.getItemAtIndex(indexPath[0])
                        let itemAtEnd = this.grid?.getItemAtIndex(indexPath.at(firstEndIndex)!)
                        indexPath = indexPath.slice(0, firstEndIndex + 1)

                        let startIndex = indexPath[0]
                        let endIndex = indexPath.at(-1)!

                        if (this.grid?.hasFreeInputAt(startIndex) && this.grid?.hasFreeOutputAt(endIndex)) {
                            connection.setEnd(itemAtEnd)
                        } else if (this.grid?.hasFreeOutputAt(startIndex) && this.grid?.hasFreeInputAt(endIndex)) {
                            connection.setEnd(itemAtEnd)
                        } else {
                            // Connectors do not fit!
                            itemAtStart?.wiggle()
                            itemAtEnd?.wiggle()
                            connection.resetEnd()
                        }
                    } else {
                        connection.resetEnd()
                    }
                } else {
                    // No valid start = no valid path
                    indexPath = []
                }
                let posPath = this.grid!.calculatePosPathFromIndices(indexPath)
                connection.setPath(posPath, indexPath)
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
                if (connection.getStart() && connection.getEnd() && !this.grid!.hasConnection(connection)) {
                    this.grid!.addConnection(connection)
                    connection = undefined
                    this.checkSources()
                } else {
                    connection.getStart()?.wiggle()
                    connection.getEnd()?.wiggle()
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
            let lastIndex = switcherPath.at(-1)
            if (!connection.getEnd()) {
                if (!lastIndex || Math.abs(indexForPointer.x - lastIndex.x) + Math.abs(indexForPointer.y - lastIndex.y) == 1) {
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

    checkSources() {
        this.grid!.getItems().forEach(item => item.reset())
        this.grid!.getConnections().forEach(connection => connection.setDirectedWithPower(false))

        for (let powerSource of this.grid!.getPowerSources()) {
            this.forwardPower(powerSource, this.grid!.getConnections());
        }

        if (this.grid!.getItems().filter(item => item.isLightBulb()).every(bulb => (bulb as Light).isOn())) {
            // Blending in Win Screen, unlocking next level
            console.log("WON!")
        }
    }

    private forwardPower(source: ConnectionPartner, connections: Connection[]) {
        // Also non powers have to be forwarded!
        let leftUndirectedConnections = connections.filter(connection => !connection.isDirectedWithPower())
        for (let connection of leftUndirectedConnections) {
            if (connection.getSource() == source) {
                let consumer = connection.getConsumer()!
                connection.setDirectedWithPower(true)
                consumer.consume()

                // We need to check here how much power is supplied
                // Here are only those relevant that can provide energy!
                let incomingConnections = this.grid!.getConnectionsFor(consumer)
                    .filter(connection => connection.getConsumer() == consumer)

                if (consumer.isPowerForwarder() && consumer.powerForwardCanBeChecked(incomingConnections)) {
                    let powerProvidedAfter = consumer.powerAvailableAfter(incomingConnections)
                    if (powerProvidedAfter) {
                        this.forwardPower(consumer, leftUndirectedConnections)
                    }
                }
            }
        }
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
