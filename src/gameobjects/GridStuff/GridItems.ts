import {Scene} from "phaser";
import {Item} from "../../interfaces/Item";
import {Vec2, vec2Add} from "../../Helpers/VecMath";
import {Vector2Dict} from "../../Helpers/Dict";
import {GridSize} from "./GridConsts";
import {TweenTimeline} from "../../Helpers/TweenTimeline";
import {Connection} from "../Connection";
import {DEPTHS} from "../../Helpers/Depths";

export interface Connector {
    item: Item;
    used: boolean;
    isInput: boolean;
}

export class GridItems {
    private scene: Scene;
    private gridSize?: GridSize;
    private items: Item[];
    private mainIndexMap: Vector2Dict<Item>;
    private allIndexMap: Vector2Dict<Item>;
    private inConnectorMap: Vector2Dict<Connector>;
    private outConnectorMap: Vector2Dict<Connector>;
    private itemLayer: Phaser.GameObjects.Layer;

    constructor(scene: Scene) {
        this.scene = scene;
        this.items = [];
        this.mainIndexMap = new Vector2Dict();
        this.allIndexMap = new Vector2Dict();
        this.inConnectorMap = new Vector2Dict();
        this.outConnectorMap = new Vector2Dict();
        this.itemLayer = this.scene.add.layer();
        this.itemLayer.setDepth(DEPTHS.ITEMS);
    }

    setGridSize(gridSize: GridSize) {
        this.gridSize = gridSize
    }

    addItemAtIndex(item: Item, topLeftIndex: Vec2, position: Vec2) {
        this.itemLayer.add(item);
        this.items.push(item);

        this.mainIndexMap.set(topLeftIndex, item);
        item.setPosition(position.x, position.y);
        item.setScale(this.gridSize!.relativeScale);
        item.setDepth(topLeftIndex.y);
        item.setIndex(topLeftIndex);

        for (let colOffset = 0; colOffset < item.getColWidth(); colOffset++) {
            for (let rowOffset = 0; rowOffset < item.getRowHeight(); rowOffset++) {
                let offsetIndex = {x: topLeftIndex.x + colOffset, y: topLeftIndex.y + rowOffset};
                this.allIndexMap.set(offsetIndex, item);
            }
        }
        
        // Set connectors
        let leftBottomIndex = {x: topLeftIndex.x, y: topLeftIndex.y};
        for (let i = 0; i < item.getNumberOfInputs(); i++) {
            let offsetIndex = vec2Add(leftBottomIndex, {x: -1, y: i});
            item.addIncomingConnectorIndex(offsetIndex);
            this.inConnectorMap.set(offsetIndex, {item: item, used: false, isInput: true});
        }

        let rightTopIndex = {x: topLeftIndex.x + item.getColWidth() - 1, y: topLeftIndex.y};
        for (let j = 0; j < item.getNumberOfOutputs(); j++) {
            let offsetIndex = vec2Add(rightTopIndex, {x: 1, y: j});
            item.addOutgoingConnectorIndex(offsetIndex);
            this.outConnectorMap.set(offsetIndex, {item: item, used: false, isInput: false});
        }
    }

    getItemAtIndex(topLeftIndex: Vec2): Item | undefined {
        return this.allIndexMap.get(topLeftIndex);
    }

    repositionItems(getPositionForIndex: (index: Vec2) => Vec2, gridSize: GridSize) {
        this.items.forEach(item => {
            const index = item.getGridIndex()!;
            const newPos = getPositionForIndex(index);
            item.setPosition(newPos.x, newPos.y);
            item.setScale(gridSize.relativeScale);
        });
    }

    getItems() {
        return this.items;
    }

    hasNeitherItemNorUsedConnectorAt(v: Vec2) {
        return !this.allIndexMap.has(v) && !this.inConnectorMap.has(v) && !this.outConnectorMap.has(v);
    }

    hasFreeInputAt(index: Vec2) {
        return this.inConnectorMap.has(index) && !this.inConnectorMap.get(index)!.used;
    }

    hasFreeOutputAt(index: Vec2) {
        return this.outConnectorMap.has(index) && !this.outConnectorMap.get(index)!.used;
    }

    async fadeInItems() {
        return new TweenTimeline({
            scene: this.scene,
            tweens: this.items.map((item, index) => {
                return {
                    at: index * 100,
                    targets: item,
                    scale: this.gridSize!.relativeScale,
                    ease: Phaser.Math.Easing.Back.Out,
                    duration: 500
                };
            })
        }).asPromise();
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
                };
            }),
            onComplete: () => {
                this.items.forEach(item => item.destroy());
                this.items = [];
            }
        }).asPromise();
    }

    getConnectorAtIndex(index: Vec2) {
        return this.inConnectorMap.get(index) || this.outConnectorMap.get(index);
    }

    addConnection(connection: Connection) {
        let outConnectorEntry = this.outConnectorMap.get(connection.getSourceIndex()!)!;
        this.outConnectorMap.set(connection.getSourceIndex()!, {
            item: outConnectorEntry.item,
            used: true,
            isInput: false
        });

        let inConnectorEntry = this.inConnectorMap.get(connection.getConsumerIndex()!)!;
        this.inConnectorMap.set(connection.getConsumerIndex()!, {
            item: inConnectorEntry.item,
            used: true,
            isInput: true
        });
    }

    removeConnection(connection: Connection) {
        let outConnectorEntry = this.outConnectorMap.get(connection.getSourceIndex()!)!;
        this.outConnectorMap.set(connection.getSourceIndex()!, {
            item: outConnectorEntry.item,
            used: false,
            isInput: false
        });

        let inConnectorEntry = this.inConnectorMap.get(connection.getConsumerIndex()!)!;
        this.inConnectorMap.set(connection.getConsumerIndex()!, {
            item: inConnectorEntry.item,
            used: false,
            isInput: true
        });
    }
}