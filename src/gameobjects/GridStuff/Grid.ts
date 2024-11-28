import {Scene} from "phaser";
import {GridPoints} from "./GridPoints";
import {GridItems} from "./GridItems";
import {GridConnections} from "./GridConnections";
import {Item} from "../../interfaces/Item";
import {Connection} from "../Connection";
import {Vec2, vec2Equals, vec2Mean} from "../../Helpers/VecMath";
import {GridSize} from "./GridConsts";
import {GridCalculator} from "./GridCalculator";
import {AStarGrid} from "../../AStar/AStarFinder";

export class Grid implements AStarGrid {
    private x: number;
    private y: number;
    private gridSize: GridSize;
    private gridCalculator?: GridCalculator;
    private gridPoints: GridPoints;
    private gridItems: GridItems;
    private gridConnections: GridConnections;

    constructor(scene: Scene, centerX: number, centerY: number, columns: number, rows: number, gridSize: GridSize) {
        this.x = centerX;
        this.y = centerY;
        this.gridSize = gridSize;

        this.gridPoints = new GridPoints(scene, gridSize);
        this.gridItems = new GridItems(scene);
        this.gridConnections = new GridConnections(scene);

        this.updateGridDimensions(columns, rows, gridSize);
    }

    getNeighbors(v: Vec2, exceptionIndices: Vec2[] = []): Vec2[] {
        return this.gridCalculator!.getPotentialNeighbors(v)
            .filter(index => this.isFreeAt(index, v)
                || exceptionIndices.some(item => vec2Equals(item, index) && this.getConnectorAtIndex(index)));
    }

    isFreeAt(index: Vec2, comingFrom: Vec2): boolean {
        return this.gridItems.hasNeitherItemNorUsedConnectorAt(index)
            && !this.gridConnections.hasConnection([index, comingFrom]);
    }

    updateGridDimensions(columns: number, rows: number, gridSize: GridSize) {
        this.gridSize = gridSize;
        this.gridCalculator = new GridCalculator(this.x, this.y, columns, rows, gridSize);
        this.gridItems.setGridSize(gridSize);
        this.gridPoints.setGridSize(gridSize);

        this.gridPoints.showGridPoints(this.gridCalculator.getPointPositions());
        this.gridItems.repositionItems((index: Vec2) => this.gridCalculator!.getPositionForIndex(index), gridSize);
        this.gridConnections.repositionConnections((indexPath: Vec2[]) => this.calculatePosPathFromIndices(indexPath), gridSize);
    }

    getPositionForIndex(index: Vec2): Vec2 {
        return this.gridCalculator!.getPositionForIndex(index);
    }

    getIndexForPosition(pos: Vec2): Vec2 {
        return this.gridCalculator!.getIndexForPosition(pos);
    }

    showGrid() {
        this.gridPoints.showGridPoints(this.gridCalculator!.getPointPositions());
    }

    hideGrid() {
        this.gridPoints.hideGridPoints();
    }

    async fadeInGrid() {
        await this.gridPoints.fadeInGridPoints(this.gridCalculator!.getPointPositions());
        await this.gridItems.fadeInItems();
        await this.gridConnections.fadeInConnections();
    }

    async fadeOutGrid() {
        await this.gridConnections.fadeOutConnections();
        await this.gridItems.fadeOutItems();
        await this.gridPoints.fadeOutGridPoints()
    }

    addItemAtIndex(index: Vec2, item: Item) {
        // Position item
        let centerIndex = {
            x: index.x + (item.getColWidth() - 1) / 2,
            y: index.y + (item.getRowHeight() - 1) / 2
        };
        let itemPosition = this.gridCalculator!.getPositionForIndex(centerIndex);
        this.gridItems.addItemAtIndex(item, index, itemPosition);
    }

    addUnfinishedConnection(connection: Connection) {
        connection.setGridSize(this.gridSize);
        this.gridConnections.addUnfinishedConnection(connection);
    }

    addConnection(connection: Connection) {
        connection.setGridSize(this.gridSize);
        connection.fixate();
        this.gridConnections.addConnection(connection);
        this.gridItems.addConnection(connection);
    }

    removeConnection(connection: Connection) {
        this.gridConnections.removeConnection(connection);
        this.gridItems.removeConnection(connection);
    }

    getItems(): Item[] {
        return this.gridItems.getItems();
    }

    getPowerSources(): Item[] {
        return this.gridItems.getItems().filter(item => item.isPowerSource());
    }

    getConnections(): Connection[] {
        return this.gridConnections.getConnections();
    }

    getGridSize(): GridSize {
        return this.gridSize;
    }

    hasFreeInputAt(index: Vec2) {
        return this.gridItems.hasFreeInputAt(index);
    }

    hasFreeOutputAt(index: Vec2) {
        return this.gridItems.hasFreeOutputAt(index);
    }

    getItemAtIndex(index: Vec2) {
        return this.gridItems.getItemAtIndex(index);
    }

    getConnectorAtIndex(index: Vec2) {
        return this.gridItems.getConnectorAtIndex(index);
    }

    calculatePosPathFromIndices(indexPath: Vec2[]) {
        if (indexPath.length < 2) {
            return indexPath.map(index => this.getPositionForIndex(index));
        }
        let pathsWithBetweens: Vec2[] = [];
        for (let i = 0; i < indexPath.length - 1; i++) {
            pathsWithBetweens.push(indexPath[i], vec2Mean(indexPath[i], indexPath[i + 1]));
        }

        pathsWithBetweens.push(indexPath.at(-1)!);

        return pathsWithBetweens.map(index => this.getPositionForIndex(index));
    }

    getConnectionWithConnectorIndex(index: Vec2) {
        return this.gridConnections.getConnectionForConnectorIndex(index);
    }

    hasSimilarConnection(connection: Connection) {
        let startIsSource = this.hasFreeOutputAt(connection.getStartIndex());
        return this.gridConnections.hasSimilarConnection(connection, startIsSource);
    }

    getConnectionsFor(item: Item) {
        return this.gridConnections.getConnections()
            .filter(connection =>
                connection.getConsumer()! == item
                || connection.getSource()! == item);
    }
}