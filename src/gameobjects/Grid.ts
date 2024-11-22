import Graphics = Phaser.GameObjects.Graphics;
import Layer = Phaser.GameObjects.Layer;
import Clamp = Phaser.Math.Clamp;
import Container = Phaser.GameObjects.Container;
import Image = Phaser.GameObjects.Image;
import {Scene} from "phaser"
import {Vector2Dict, Vector2PairDict,} from "../Helpers/Dict"
import {GameColors, Item} from "../interfaces/Item"
import {Vec2, vec2Add, vec2Equals, vec2Mean} from "../Helpers/VecMath"
import {Connection} from "./Connection"
import {AStarGrid} from "../AStar/AStarFinder";
import {GAME_HEIGHT, GAME_WIDTH} from "../index";
import {DEPTHS} from "../Helpers/Depths";
import {TweenTimeline} from "../Helpers/TweenTimeline";

export type GridSize = {
    unitSize: number,
    relativeScale: number
}

export const GridSizes = {
    XS: {unitSize: 80, relativeScale: 0.4},
    S: {unitSize: 100, relativeScale: 0.5},
    M: {unitSize: 120, relativeScale: 0.6},
    L: {unitSize: 160, relativeScale: 0.8},
    XL: {unitSize: 200, relativeScale: 1},
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
    private points?: Image[] = []

    // Depth 1
    private items: Item[] = []
    private itemLayer: Layer
    private itemMap: Vector2Dict<Item> = new Vector2Dict()
    private inConnectorMap: Vector2Dict<ConnectorInUsed> = new Vector2Dict()
    private outConnectorMap: Vector2Dict<ConnectorInUsed> = new Vector2Dict()

    // Depth 2
    private connections: Connection[] = []
    private connectionNodePairs: Vector2PairDict<Connection> = new Vector2PairDict<Connection>()
    private connectionLayer: Layer

    constructor(scene: Scene, centerX: number, centerY: number, width: number, height: number, gridSize: GridSize) {
        this.scene = scene
        this.x = centerX
        this.y = centerY
        this.gridSize = gridSize
        this.colWidth = gridSize.unitSize
        this.rowWidth = gridSize.unitSize
        this.columns = width
        this.rows = height
        this.minColIndex = -Math.floor(this.columns / 2)
        this.maxColIndex = Math.floor(this.columns / 2)
        this.minRowIndex = -Math.floor(this.rows / 2)
        this.maxRowIndex = Math.floor(this.rows / 2)
        this.evenColsOffset = (this.columns % 2 == 0) ? this.colWidth / 2 : 0
        this.evenRowsOffset = (this.rows % 2 == 0) ? this.rowWidth / 2 : 0

        // Set up grid points
        this.gridPointGraphics = this.scene.add.graphics({fillStyle: {color: GRID_POINT_COLOR}})
        this.gridPointLayer = this.scene.add.layer(this.gridPointGraphics)
        this.gridPointLayer.setDepth(DEPTHS.GRID)

        // Set up connections
        this.connectionLayer = this.scene.add.layer()
        this.connectionLayer.setDepth(DEPTHS.CONNECTIONS)

        // Set up item layer
        this.itemLayer = this.scene.add.layer()
        this.itemLayer.setDepth(DEPTHS.ITEMS)
    }

    getGridSize() {
        return this.gridSize
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

        // Set connectors
        let leftBottomIndex = {x: bottomLeftIndex.x, y: bottomLeftIndex.y}
        for (let i = 0; i < item.getNumberOfInputs(); i++) {
            let offsetIndex = vec2Add(leftBottomIndex, {x: -1, y: i})
            item.addIncomingConnectorIndex(offsetIndex)
            this.inConnectorMap.set(offsetIndex, {item: item, used: false, isInput: true})
        }

        let rightTopIndex = {x: bottomLeftIndex.x + item.getColWidth() - 1, y: bottomLeftIndex.y}
        for (let j = 0; j < item.getNumberOfOutputs(); j++) {
            let offsetIndex = vec2Add(rightTopIndex, {x: 1, y: j})
            item.addOutgoingConnectorIndex(offsetIndex)
            this.outConnectorMap.set(offsetIndex, {item: item, used: false, isInput: false})
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

    fadeInItems() {
        let fadeInTimeline = new TweenTimeline({
            scene: this.scene,
            tweens: this.items.map((item, index) => {
                return {
                    at: index * 100,
                    targets: item,
                    scale: this.gridSize.relativeScale,
                    ease: Phaser.Math.Easing.Back.Out,
                    duration: 500
                }
            })
        })
    }

    async fadeInGrid() {
        this.gridPointGraphics.clear();
        this.points?.forEach(point => point.destroy());
        this.points = []
        let gridPointRadius = GRID_POINT_SIZE * this.gridSize.unitSize;
        this.gridPointGraphics.fillCircle(gridPointRadius, gridPointRadius, gridPointRadius);
        this.scene.textures.remove("singleGridPointTexture");
        this.gridPointGraphics.generateTexture('singleGridPointTexture', 2 * gridPointRadius, 2 * gridPointRadius);
        this.gridPointGraphics.clear();

        for (let x = this.minColIndex; x <= this.maxColIndex; x++) {
            for (let y = this.minRowIndex; y <= this.maxRowIndex; y++) {
                const index = {x, y};
                const pos = this.getPositionForIndex(index);
                const point = this.scene.add.image(pos.x, pos.y, 'singleGridPointTexture')
                    .setScale(0)
                    .setAlpha(0);
                this.points.push(point);
            }
        }

        let leftTopPosition = this.getPositionForIndex({x: this.minColIndex, y: this.minRowIndex});
        await new TweenTimeline({
            scene: this.scene,
            tweens: this.points!.map(point => {
                return {
                    at: 0.5*((point.x - leftTopPosition.x) + (point.y - leftTopPosition.y)),
                    targets: point,
                    scale: 1,
                    alpha: 1,
                    duration: 200
                }
            }),
            onComplete: () => {
                this.replacePointsWithImage();
            }
        }).asPromise()
    }

    async fadeOutItems() {
        await new TweenTimeline({
            scene: this.scene,
            tweens: this.items.map((item, index) => {
                return {
                    at: index * 100,
                    targets: item,
                    scale: 0,
                    ease: Phaser.Math.Easing.Back.In,
                    duration: 500
                }
            }),
            onComplete: () => {
                this.items.forEach(item => item.destroy());
                this.items = []
            }
        }).asPromise()
    }

    fadeOutConnections() {
        this.connections.forEach(connection => connection.kill(false))
    }

    async fadeOutGrid() {
        this.gridImage?.destroy()
        this.points?.forEach(point => point.setVisible(true));

        let leftTopPosition = this.getPositionForIndex({x: this.minColIndex, y: this.minRowIndex});
        await new TweenTimeline({
            scene: this.scene,
            tweens: this.points!.map(point => {
                return {
                    at: 0.5*((point.x - leftTopPosition.x) + (point.y - leftTopPosition.y)),
                    targets: point,
                    scale: 0,
                    alpha: 0,
                    duration: 200
                }
            }),
            onComplete: () => {
                this.points?.forEach(point => point.destroy());
                this.points = []
            }
        }).asPromise()
    }

    private replacePointsWithImage() {
        this.gridPointGraphics.clear();
        for (let x = this.minColIndex; x <= this.maxColIndex; x++) {
            for (let y = this.minRowIndex; y <= this.maxRowIndex; y++) {
                const index = {x, y};
                const pos = this.getPositionForIndex(index);
                this.gridPointGraphics.fillCircle(pos.x, pos.y, GRID_POINT_SIZE * this.gridSize.unitSize);
            }
        }

        this.scene.textures.remove("gridPointsTexture");
        this.gridPointGraphics.generateTexture('gridPointsTexture', GAME_WIDTH, GAME_HEIGHT);
        this.gridPointGraphics.clear();
        this.gridImage = this.scene.add.image(0, 0, 'gridPointsTexture').setOrigin(0, 0);
        this.points?.forEach(point => point.setVisible(false));
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