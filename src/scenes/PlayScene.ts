import Phaser from 'phaser';
import {Light} from "../gameobjects/Items/Light";
import {Power} from "../gameobjects/Items/Power";
import {Switch} from "../gameobjects/Items/Switch";
import {GAME_HEIGHT, GAME_WIDTH} from "../config";
import {Grid} from "../gameobjects/Grid";
import {Connection} from "../gameobjects/Connection";
import {Item} from "../interfaces/Item";
import {Vec2, vec2Equals} from "../Helpers/VecMath";
import {Or} from "../gameobjects/Items/Or";
import {AStarFinder} from "../AStar/AStarFinder";
import Vector2 = Phaser.Math.Vector2;


export default class PlayScene extends Phaser.Scene {
    private static GRID_UNIT_SIZE = 40
    private grid?: Grid
    private pathFinder?: AStarFinder

    private pressed: boolean = false
    private dragTime = 0
    private connection: Connection | undefined
    private indexPath: Vec2[] = [];

    constructor() {
        super({key: 'PlayScene'})
    }

    create() {
        let text = this.add.text(GAME_WIDTH / 2, 100, "Put all lights on.", {
            fontFamily: "LondrinaThin",
            fontSize: 60
        })
        text.setOrigin(0.5, 0.5)
        this.grid = new Grid(
            this,
            GAME_WIDTH / 2, GAME_HEIGHT / 2,
            18, 16,
            PlayScene.GRID_UNIT_SIZE, PlayScene.GRID_UNIT_SIZE)
        this.grid.showGrid()
        this.pathFinder = new AStarFinder();

        let dragContainer = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0, 0)
        dragContainer.setInteractive()
        this.defineItemLogic();

        this.grid.addItemAtIndex({x: -8, y: -5}, new Power(this))
        this.grid.addItemAtIndex({x: -8, y: 0}, new Power(this))
        this.grid.addItemAtIndex({x: -8, y: 5}, new Power(this))
        this.grid.addItemAtIndex({x: -3, y: -5}, new Switch(this, false))
        this.grid.addItemAtIndex({x: -3, y: 0}, new Switch(this, false))
        this.grid.addItemAtIndex({x: -3, y: 5}, new Switch(this, false))
        this.grid.addItemAtIndex({x: 3, y: 0}, new Or(this))
        this.grid.addItemAtIndex({x: 8, y: 0}, new Light(this, false))
    }

    update(time: number) {
        this.grid!.getConnections().forEach(con => con.update(time))
    }

    private defineItemLogic() {
        this.input.on('pointerdown', (pointer: Vector2) => this.onPointerDown(pointer))
        this.input.on('pointermove', (pointer: Vector2) => this.onPointerMove(pointer))
        this.input.on('pointerup', (pointer: Vector2) => this.onPointerUp(pointer))
        this.input.on('pointerupoutside', (pointer: Vector2) => this.onPointerUp(pointer))
    }

    private onPointerUp(pointer: Vector2) {
        this.pressed = false
        let item = this.grid?.getItemAtIndex(this.grid?.getIndexForPosition(pointer))
        if (item && this.time.now - this.dragTime < 300) {
            item.onClick()
            this.checkSources()
        } else if (this.connection) {
            if (this.connection.getStart() && this.connection.getEnd() && !this.grid!.hasConnection(this.connection)) {
                this.grid!.addConnection(this.connection)
                this.connection = undefined
                this.checkSources()
            } else {
                this.connection.getStart()?.wiggle()
                this.connection.getEnd()?.wiggle()
                this.connection.destroy()
            }
        }
    }

    private onPointerDown(pointer: Phaser.Math.Vector2) {
        this.pressed = true
        let index = this.grid!.getIndexForPosition(pointer)
        let item = this.grid!.getItemAtIndex(index) ?? this.grid!.getConnectorAtIndex(index)?.item
        this.dragTime = this.time.now
        if (item) {
            let currentConnectionsForItem = this.grid!.getConnectionsFor(item)
            if (currentConnectionsForItem.length < item.getNumberOfInputs() + item.getNumberOfOutputs()) {
                this.connection = new Connection(this)
                this.grid!.addConnectionToLayer(this.connection)
                this.connection.setStart(item)
                this.indexPath = [this.grid!.getIndexForPosition(pointer)]
            }
        }
    }

    private onPointerMove(pointer: Phaser.Math.Vector2) {
        if (!this.pressed || !this.connection) {
            return
        }

        let indexForPointer = this.grid!.getIndexForPosition(pointer)

        // Calculate path with only duplicate checking
        this.indexPath = this.addPointToPath(indexForPointer, this.indexPath);

        // Adapt Start And End
        let startIndex = this.indexPath.slice().reverse().findIndex(index => {
            let connector = this.grid!.getConnectorAtIndex(index);
            return connector && !connector.used && connector.item == this.connection!.getStart()
        })

        if (startIndex > -1) {
            this.indexPath = this.indexPath.slice(this.indexPath.length - 1 - startIndex)

            let firstInvalidIndex = this.indexPath.findIndex(index => {
                return (this.grid!.getItemAtIndex(index) != undefined) || (this.grid?.getConnectorAtIndex(index)?.used)
            })
            if (firstInvalidIndex > -1) {
                console.log("Found invalid indices. Slicing away: ", this.indexPath.length - firstInvalidIndex)
                this.indexPath = this.indexPath.slice(0, firstInvalidIndex)
            }

            let firstEndIndex = this.indexPath.findIndex(index => {
                let connector = this.grid!.getConnectorAtIndex(index);
                if (connector && connector.item != this.connection!.getStart()) {
                    return true
                }
            })
            if (firstEndIndex > -1) {
                // Start and End found, now check if feasible connectors exist
                if (this.indexPath.length - 1 != firstEndIndex) {
                    let pathToAdd = this.pathFinder!.findPath(this.grid!, this.indexPath[firstEndIndex - 1], this.indexPath.at(-1)!)
                    this.indexPath = this.removeDuplicates(pathToAdd, this.indexPath.slice(0, firstEndIndex));
                }

                let startIndex = this.indexPath[0]
                let endIndex = this.indexPath.at(-1)!
                let itemAtEnd = this.grid!.getConnectorAtIndex(endIndex)?.item

                if (this.grid?.hasFreeInputAt(startIndex) && this.grid?.hasFreeOutputAt(endIndex)) {
                    this.connection.setEnd(itemAtEnd)
                } else if (this.grid?.hasFreeOutputAt(startIndex) && this.grid?.hasFreeInputAt(endIndex)) {
                    this.connection.setEnd(itemAtEnd)
                } else {
                    // Connectors do not fit!
                    let itemAtStart = this.grid!.getItemAtIndex(startIndex)
                    itemAtStart?.wiggle()
                    itemAtEnd?.wiggle()
                    this.connection.resetEnd()
                }
            } else {
                console.log("Found no end index")
                this.connection.resetEnd()
            }
        } else {
            // No valid start = no valid path
            console.log("Found no start index")
            this.indexPath = []
        }

        let posPath = this.grid!.calculatePosPathFromIndices(this.indexPath)
        this.connection.setPath(posPath, this.indexPath)
        this.connection.draw();
    }

    private addPointToPath(indexForPointer: Vec2, switcherPath: Vec2[]): Vec2[] {
        let lastIndex = switcherPath.at(-1)
        let newIndices: Vec2[] = []
        if (!lastIndex || Math.abs(indexForPointer.x - lastIndex.x) + Math.abs(indexForPointer.y - lastIndex.y) == 1) {
            newIndices.push(indexForPointer)
        } else {
            // Add trivial connection path
            newIndices = this.pathFinder!.findPath(this.grid!, lastIndex, indexForPointer);
        }

        switcherPath = this.removeDuplicates(newIndices, switcherPath);
        return switcherPath;
    }

    private removeDuplicates(newIndices: Vec2[], switcherPath: Vec2[]) {
        for (let newIndex of newIndices) {
            let previousOccurrenceInPath = switcherPath.findIndex(index => vec2Equals(index, newIndex))
            if (previousOccurrenceInPath > -1) {
                if (previousOccurrenceInPath != switcherPath.length - 1) {
                    // if last occurence was last index, there would be nothing to do
                    // otherwise reset path to last occurence
                    switcherPath = switcherPath.slice(0, Math.max(previousOccurrenceInPath + 1, 1))
                }
            } else {
                // Add new point
                switcherPath.push(newIndex)
            }
        }
        return switcherPath;
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

    private forwardPower(source: Item, connections: Connection[]) {
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
}