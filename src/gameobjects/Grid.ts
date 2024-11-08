import Graphics = Phaser.GameObjects.Graphics;
import Layer = Phaser.GameObjects.Layer;
import Clamp = Phaser.Math.Clamp;
import {Scene} from "phaser"
import {Vector2Dict,} from "../Helpers/Dict"
import {Item, GameColors} from "../interfaces/Item"
import {Vec2, vec2Add, vec2Equals, vec2Mean} from "../Helpers/VecMath"
import {Connection} from "./Connection"
import {AStarGrid} from "../AStar/AStarFinder";
import Container = Phaser.GameObjects.Container;

export type ConnectorInUsed = {
    item: Item,
    used: boolean,
    isInput: boolean
}

export const GRID_UNIT_SIZE = 45
export const GRID_POINT_SIZE = 4
export const CONNECTOR_INSIDE_POINT_SIZE = 8
export const ELECTRON_SIZE = 8

export const GRID_POINT_COLOR = GameColors.BLUE
export const IN_CONNECTOR_INNER_USED_COLOR = GameColors.DARK_BLUE
export const IN_CONNECTOR_INNER_UNUSED_COLOR = GameColors.DARK_BLUE
export const OUT_CONNECTOR_INNER_USED_COLOR = GameColors.DARK_BLUE
export const OUT_CONNECTOR_INNER_UNUSED_COLOR = GameColors.DARK_BLUE
export const UNUSED_CONNECTION_COLOR = GameColors.ORANGE
export const USED_CONNECTION_COLOR = GameColors.LIGHT_ORANGE
export const ELECTRON_COLOR = GameColors.LIGHT

export class Grid implements AStarGrid {
    scene: Scene
    x: number
    y: number
    minColIndex: number
    maxColIndex: number
    minRowIndex: number
    maxRowIndex: number
    private columns: number
    private rows: number
    private colWidth: number
    private rowWidth: number
    private evenColsOffset: number
    private evenRowsOffset: number

    // Depth 0
    private gridPointGraphics: Graphics
    private gridPointLayer: Layer

    // Depth 1
    private items: Item[] = []
    private itemLayer: Layer
    private itemMap: Vector2Dict<Item> = new Vector2Dict()

    private inConnectorMap: Vector2Dict<ConnectorInUsed> = new Vector2Dict()
    private outConnectorMap: Vector2Dict<ConnectorInUsed> = new Vector2Dict()
    private connectorImages: Container
    private connectorPointLayer: Layer

    // Depth 2
    private connections: Connection[] = []
    private connectionLayer: Layer

    constructor(scene: Scene, centerX: number, centerY: number, columns: number, rows: number) {
        this.scene = scene
        this.x = centerX
        this.y = centerY
        this.columns = columns
        this.rows = rows
        this.minColIndex = -columns / 2
        this.maxColIndex = columns / 2
        this.minRowIndex = -rows / 2
        this.maxRowIndex = rows / 2
        this.colWidth = GRID_UNIT_SIZE
        this.rowWidth = GRID_UNIT_SIZE
        this.evenColsOffset = (this.columns % 2 == 0) ? this.colWidth / 2 : 0
        this.evenRowsOffset = (this.rows % 2 == 0) ? this.rowWidth / 2 : 0

        // Set up grid points
        this.gridPointGraphics = this.scene.add.graphics({fillStyle: {color: GRID_POINT_COLOR}})
        this.gridPointGraphics.setAlpha(0)
        this.gridPointLayer = this.scene.add.layer(this.gridPointGraphics)
        this.gridPointLayer.setDepth(0)
        this.updateGridRender()

        // Set up connectors
        this.connectorImages = this.scene.add.container()
        this.connectorPointLayer = this.scene.add.layer([this.connectorImages])
        this.connectorPointLayer.setDepth(1)

        // Set up connections
        this.connectionLayer = this.scene.add.layer()
        this.connectionLayer.setDepth(2)

        // Set up item layer
        this.itemLayer = this.scene.add.layer()
        this.itemLayer.setDepth(3)
    }

    isFreeAt(v: Vec2): boolean {
        return !this.itemMap.has(v) && !this.inConnectorMap.has(v) && !this.outConnectorMap.has(v)
    }

    getNeighbors(v: Vec2, exceptions: Vec2[] = []): Vec2[] {
        return [{x: v.x - 1, y: v.y},
            {x: v.x + 1, y: v.y},
            {x: v.x, y: v.y - 1},
            {x: v.x, y: v.y + 1}]
            .filter(index => index.x >= this.minColIndex && index.x <= this.maxColIndex
                && index.y >= this.minRowIndex && index.y <= this.maxRowIndex)
            .filter(index => this.isFreeAt(index) || exceptions.some(item => vec2Equals(item, index)))
    };

    addConnectionToLayer(connection: Connection) {
        this.connectionLayer.add(connection)
    }

    addConnection(connection: Connection) {
        let startIsSource = this.hasFreeOutputAt(connection.getStartIndex())
        connection.setSourceAndConsumerData(startIsSource)
        this.connections.push(connection)

        let outConnectorEntry = this.outConnectorMap.get(connection.getSourceIndex()!)!
        this.outConnectorMap.set(connection.getSourceIndex()!, {
            item: outConnectorEntry.item,
            used: true,
            isInput: false
        })

        let inConnectorEntry = this.inConnectorMap.get(connection.getConsumerIndex()!)!
        this.inConnectorMap.set(connection.getConsumerIndex()!, {
            item: inConnectorEntry.item,
            used: true,
            isInput: true
        })
    }

    calculatePosPathFromIndices(indexPath: Vec2[]): Vec2[] {
        if (indexPath.length < 2) {
            return indexPath.map(index => this.getPositionForIndex(index))
        }

        var pathsWithBetweens: Vec2[] = []
        for (let i = 0; i < indexPath.length - 1; i++) {
            pathsWithBetweens.push(indexPath[i], vec2Mean(indexPath[i], indexPath[i + 1]))
        }
        pathsWithBetweens.push(indexPath.at(-1)!)

        return pathsWithBetweens.map(index => this.getPositionForIndex(index))
    }

    addItemAtIndex(bottomLeftIndex: Vec2, item: Item) {
        this.itemLayer.add(item)
        this.items.push(item);
        item.setWithUnitSize(this.colWidth)
        for (let colOffset = 0; colOffset < item.getColWidth(); colOffset++) {
            for (let rowOffset = 0; rowOffset < item.getRowHeight(); rowOffset++
            ) {
                let offsetIndex = {x: bottomLeftIndex.x + colOffset, y: bottomLeftIndex.y + rowOffset}
                this.itemMap.set(offsetIndex, item)
            }
        }
        this.updateGridRender()

        // Position item
        let centerIndex = {
            x: bottomLeftIndex.x + (item.getColWidth() - 1) / 2,
            y: bottomLeftIndex.y + (item.getRowHeight() - 1) / 2
        }
        let center = this.getPositionForIndex(centerIndex)
        item.setPosition(center.x, center.y)
        item.setDepth(bottomLeftIndex.y)


        // Set connectors
        let leftBottomIndex = {x: bottomLeftIndex.x, y: bottomLeftIndex.y}
        for (let i = 0; i < item.getNumberOfInputs(); i++) {
            let offsetIndex = vec2Add(leftBottomIndex, {x: -1, y: i})
            let offsetPosition = this.getPositionForIndex(offsetIndex)
            this.inConnectorMap.set(offsetIndex, {item: item, used: false, isInput: true})
            this.connectorImages.add(this.scene.add.image(offsetPosition.x + 24, offsetPosition.y, 'connector_plus'))
        }

        let rightTopIndex = {x: bottomLeftIndex.x + item.getColWidth() - 1, y: bottomLeftIndex.y}
        for (let j = 0; j < item.getNumberOfOutputs(); j++) {
            let offsetIndex = vec2Add(rightTopIndex, {x: 1, y: j})
            let offsetPosition = this.getPositionForIndex(offsetIndex)
            this.outConnectorMap.set(offsetIndex, {item: item, used: false, isInput: false})
            this.connectorImages.add(this.scene.add.image(offsetPosition.x - 24, offsetPosition.y, 'connector_minus'))
        }
    }

    getPositionForIndex(index: Vec2): Vec2 {
        return {
            x: this.x + index.x * this.colWidth + this.evenColsOffset,
            y: this.y + index.y * this.rowWidth + this.evenRowsOffset
        }
    }

    getIndexForPosition(pos: Vec2): Vec2 {
        return {
            x: Clamp(Math.round((pos.x - this.evenColsOffset - this.x) / this.colWidth), this.minColIndex, this.maxColIndex),
            y: Clamp(Math.round((pos.y - this.evenRowsOffset - this.y) / this.rowWidth), this.minRowIndex, this.maxRowIndex),
        }
    }

    showGrid() {
        this.gridPointGraphics.setAlpha(1)
    }

    getItemAtIndex(index: Vec2): Item | undefined {
        return this.itemMap.get(index)
    }

    private updateGridRender() {
        this.gridPointGraphics.clear()
        for (let x = -this.columns / 2; x <= this.columns / 2; x++) {
            for (let y = -this.rows / 2; y <= this.rows / 2; y++) {
                var index = {x: x, y: y}
                var pos = this.getPositionForIndex(index)
                if (!this.itemMap.has(index)) {
                    this.gridPointGraphics.fillCircle(pos.x, pos.y, GRID_POINT_SIZE)
                }

            }
        }
    }

    getConnections() {
        return this.connections
    }

    getItems() {
        return this.items
    }

    hasFreeInputAt(index: Vec2) {
        let mapEntry = this.inConnectorMap.get(index)
        if (mapEntry) {
            return !mapEntry.used
        }
        return false
    }

    hasFreeOutputAt(index: Vec2) {
        let mapEntry = this.outConnectorMap.get(index)
        if (mapEntry) {
            return !mapEntry.used
        }
        return false
    }

    getConnectorAtIndex(index: Vec2) {
        return this.inConnectorMap.get(index) ?? this.outConnectorMap.get(index)
    }

    getConnectionsFor(item: Item) {
        return this.connections.filter(connection =>
            connection.getConsumer()! == item
            || connection.getSource()! == item)
    }

    hasConnection(connection: Connection) {
        let startIsSource = this.hasFreeOutputAt(connection.getStartIndex())
        let source = startIsSource ? connection.getStart() : connection.getEnd()
        let consumer = startIsSource ? connection.getEnd() : connection.getStart()
        return this.connections
            .filter(existing => existing.getConsumer()! == consumer && existing.getSource()! == source)
            .length > 0
    }

    getPowerSources() {
        return this.items.filter(item => item.isPowerSource())
    }
}