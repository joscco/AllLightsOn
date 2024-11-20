import Graphics = Phaser.GameObjects.Graphics;
import Layer = Phaser.GameObjects.Layer;
import Clamp = Phaser.Math.Clamp;
import Container = Phaser.GameObjects.Container;
import {Scene} from "phaser"
import {Vector2Dict, Vector2PairDict,} from "../Helpers/Dict"
import {GameColors, Item} from "../interfaces/Item"
import {Vec2, vec2Add, vec2Equals, vec2Mean} from "../Helpers/VecMath"
import {Connection} from "./Connection"
import {AStarGrid} from "../AStar/AStarFinder";
import {GAME_HEIGHT, GAME_WIDTH} from "../index";
import {DEPTHS} from "../Helpers/Depths";

export enum GridSize {
    XS, S, M, L
}

export interface ConnectorInUsed {
    item: Item,
    used: boolean,
    isInput: boolean
}

export const GRID_POINT_SIZE = 0.1
export const GRID_POINT_COLOR = GameColors.BLUE

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
    private gridSize: GridSize
    private colWidth: number
    private rowWidth: number
    private evenColsOffset: number
    private evenRowsOffset: number

    // Depth 0
    private gridPointGraphics: Graphics
    private gridPointLayer: Layer
    private gridImage?: Phaser.GameObjects.Image;

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
    private connectionNodePairs: Vector2PairDict<Connection> = new Vector2PairDict<Connection>()
    private connectionLayer: Layer

    constructor(scene: Scene, centerX: number, centerY: number, width: number, height: number, gridSize: GridSize) {
        this.scene = scene
        this.x = centerX
        this.y = centerY
        this.colWidth = Grid.getUnitSize(gridSize)
        this.rowWidth = Grid.getUnitSize(gridSize)
        this.columns = width
        this.rows = height
        this.minColIndex = -Math.floor(this.columns / 2)
        this.maxColIndex = Math.floor(this.columns / 2)
        this.minRowIndex = -Math.floor(this.rows / 2)
        this.maxRowIndex = Math.floor(this.rows / 2)
        this.gridSize = gridSize
        this.evenColsOffset = (this.columns % 2 == 0) ? this.colWidth / 2 : 0
        this.evenRowsOffset = (this.rows % 2 == 0) ? this.rowWidth / 2 : 0

        // Set up grid points
        this.gridPointGraphics = this.scene.add.graphics({fillStyle: {color: GRID_POINT_COLOR}})
        this.gridPointLayer = this.scene.add.layer(this.gridPointGraphics)
        this.gridPointLayer.setDepth(DEPTHS.GRID)

        // Set up connectors
        this.connectorImages = this.scene.add.container()
        this.connectorPointLayer = this.scene.add.layer([this.connectorImages])
        this.connectorPointLayer.setDepth(DEPTHS.CONNECTORS)

        // Set up connections
        this.connectionLayer = this.scene.add.layer()
        this.connectionLayer.setDepth(DEPTHS.CONNECTORS)

        // Set up item layer
        this.itemLayer = this.scene.add.layer()
        this.itemLayer.setDepth(DEPTHS.ITEMS)
    }

    private static getUnitSize(gridSize: GridSize) {
        switch (gridSize) {
            case GridSize.XS:
                return 58
            case GridSize.S:
                return 78
            case GridSize.M:
                return 98
            case GridSize.L:
                return 110
        }
    }

    public getUnitSize() {
        return Grid.getUnitSize(this.gridSize)
    }

    private static getItemScale(gridSize: GridSize) {
        return this.getUnitSize(gridSize) / 200
    }

    isFreeAt(v: Vec2, comingFrom: Vec2): boolean {
        return !this.itemMap.has(v)
            && !this.inConnectorMap.has(v)
            && !this.outConnectorMap.has(v)
            && !this.connectionNodePairs.has([v, comingFrom])
    }

    getNeighbors(v: Vec2, exceptionIndices: Vec2[] = []): Vec2[] {
        return [{x: v.x - 1, y: v.y},
            {x: v.x + 1, y: v.y},
            {x: v.x, y: v.y - 1},
            {x: v.x, y: v.y + 1}]
            .filter(index => index.x >= this.minColIndex && index.x <= this.maxColIndex
                && index.y >= this.minRowIndex && index.y <= this.maxRowIndex)
            .filter(index => this.isFreeAt(index, v) || exceptionIndices.some(item => vec2Equals(item, index) && this.getConnectorAtIndex(index)))
    };

    addConnectionToLayer(connection: Connection) {
        this.connectionLayer.add(connection)
    }

    addConnection(connection: Connection) {
        let startIsSource = this.hasFreeOutputAt(connection.getStartIndex())
        connection.setSourceAndConsumerData(startIsSource)
        connection.fixate()
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

        let indexPath = connection.getIndexPath()
        for (let i = 0; i < indexPath.length - 2; i++) {
            this.connectionNodePairs.set([indexPath[i], indexPath[i + 1]], connection)
        }
    }

    removeConnection(connection: Connection) {
        let connectionIndex = this.connections.indexOf(connection, 0);
        if (connectionIndex > -1) {
            this.connections.splice(connectionIndex, 1);
        }

        let outConnectorEntry = this.outConnectorMap.get(connection.getSourceIndex()!)!
        this.outConnectorMap.set(connection.getSourceIndex()!, {
            item: outConnectorEntry.item,
            used: false,
            isInput: false
        })

        let inConnectorEntry = this.inConnectorMap.get(connection.getConsumerIndex()!)!
        this.inConnectorMap.set(connection.getConsumerIndex()!, {
            item: inConnectorEntry.item,
            used: false,
            isInput: true
        })

        let indexPath = connection.getIndexPath()
        for (let i = 0; i < indexPath.length - 2; i++) {
            this.connectionNodePairs.deleteAllWithValue(connection)
        }

        connection.kill(true)
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
        for (let colOffset = 0; colOffset < item.getColWidth(); colOffset++) {
            for (let rowOffset = 0; rowOffset < item.getRowHeight(); rowOffset++
            ) {
                let offsetIndex = {x: bottomLeftIndex.x + colOffset, y: bottomLeftIndex.y + rowOffset}
                this.itemMap.set(offsetIndex, item)
            }
        }

        // Position item
        let centerIndex = {
            x: bottomLeftIndex.x + (item.getColWidth() - 1) / 2,
            y: bottomLeftIndex.y + (item.getRowHeight() - 1) / 2
        }
        let center = this.getPositionForIndex(centerIndex)
        item.setPosition(center.x, center.y)
        item.setIndex(bottomLeftIndex)
        item.setDepth(bottomLeftIndex.y)
        item.setScale(Grid.getItemScale(this.gridSize))

        // Set connectors
        let leftBottomIndex = {x: bottomLeftIndex.x, y: bottomLeftIndex.y}
        for (let i = 0; i < item.getNumberOfInputs(); i++) {
            let offsetIndex = vec2Add(leftBottomIndex, {x: -1, y: i})
            item.addIncomingConnectorIndex(offsetIndex)
            let offsetPosition = this.getPositionForIndex(offsetIndex)
            this.inConnectorMap.set(offsetIndex, {item: item, used: false, isInput: true})
            let connector = this.scene.add.image(offsetPosition.x + 0.53 * this.colWidth, offsetPosition.y, 'connector_plus')
            connector.setScale(Grid.getItemScale(this.gridSize))
            this.connectorImages.add(connector)
        }

        let rightTopIndex = {x: bottomLeftIndex.x + item.getColWidth() - 1, y: bottomLeftIndex.y}
        for (let j = 0; j < item.getNumberOfOutputs(); j++) {
            let offsetIndex = vec2Add(rightTopIndex, {x: 1, y: j})
            item.addOutgoingConnectorIndex(offsetIndex)
            let offsetPosition = this.getPositionForIndex(offsetIndex)
            this.outConnectorMap.set(offsetIndex, {item: item, used: false, isInput: false})
            let connector = this.scene.add.image(offsetPosition.x - 0.53 * this.colWidth, offsetPosition.y, 'connector_minus')
            connector.setScale(Grid.getItemScale(this.gridSize))
            this.connectorImages.add(connector)
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
        this.gridPointGraphics.clear();
        for (let x = this.minColIndex; x <= this.maxColIndex; x++) {
            for (let y = this.minRowIndex; y <= this.maxRowIndex; y++) {
                const index = { x, y };
                const pos = this.getPositionForIndex(index);
                if (!this.itemMap.has(index)) {
                    this.gridPointGraphics.fillCircle(pos.x, pos.y, GRID_POINT_SIZE * Grid.getUnitSize(this.gridSize));
                }
            }
        }
        this.scene.textures.remove("gridPointTexture");
        this.gridPointGraphics.generateTexture('gridPointTexture', GAME_WIDTH, GAME_HEIGHT);
        this.gridPointGraphics.clear()
        this.gridImage = this.scene.add.image(0, 0, 'gridPointTexture').setOrigin(0, 0)
    }

    getItemAtIndex(index: Vec2): Item | undefined {
        return this.itemMap.get(index)
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

    getConnectionForConnectorIndex(connectorIndex: Vec2) {
        return this.connections.find(connection => vec2Equals(connection.getSourceIndex()!, connectorIndex)
            || vec2Equals(connection.getConsumerIndex()!, connectorIndex))
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