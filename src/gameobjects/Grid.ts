import Graphics = Phaser.GameObjects.Graphics;
import {Scene} from "phaser";
import {Vec2, vec2Mean, Vector2Dict,} from "../Helpers/Dict";
import {ConnectionPartner} from "../interfaces/ConnectionPartner";

export class Grid extends Graphics {
    x: number
    y: number
    private columns: number
    private rows: number
    private colWidth: number
    private rowWidth: number
    private evenColsOffset: number
    private evenRowsOffset: number

    private freeFieldGraphics: Graphics;
    private usedFieldGraphics: Graphics;

    private items: Vector2Dict<ConnectionPartner> = new Vector2Dict();

    constructor(scene: Scene, x: number, y: number, columns: number, rows: number, colWidth: number, rowWidth: number) {
        super(scene);
        this.x = x
        this.y = y
        this.columns = columns
        this.rows = rows
        this.colWidth = colWidth
        this.rowWidth = rowWidth

        this.evenColsOffset = (this.columns % 2 == 0) ? this.colWidth / 2 : 0
        this.evenRowsOffset = (this.rows % 2 == 0) ? this.rowWidth / 2 : 0

        this.freeFieldGraphics = scene.add.graphics({
            fillStyle: {
                color: 0x1b3953
            }
        })
        this.usedFieldGraphics = scene.add.graphics({
            fillStyle: {
                color: 0xff0000
            }
        })
        this.updateGridRender()
        this.freeFieldGraphics.setAlpha(0)
        this.usedFieldGraphics.setAlpha(0)
    }

    calculatePosPathFromIndices(indexPath: Vec2[]): Vec2[] {
        var pathsWithBetweens: Vec2[] = []
        for (let i = 0; i < indexPath.length - 1; i++) {
            pathsWithBetweens.push(indexPath[i], vec2Mean(indexPath[i], indexPath[i + 1]))
        }
        pathsWithBetweens.push(indexPath.at(-1)!)

        return pathsWithBetweens.map(index => this.getPositionForIndex(index))
    }

    addAtIndex(index: Vec2, item: ConnectionPartner) {
        for (let colOffset = 0; colOffset < item.getColWidth(); colOffset++) {
            for (let rowOffset = 0; rowOffset < item.getRowHeight(); rowOffset++) {
                let offsetIndex = {x: index.x + colOffset, y: index.y + rowOffset}
                this.items.set(offsetIndex, item)
            }
        }
        this.updateGridRender()

        var topRight = this.getPositionForIndex({
            x: index.x + (item.getColWidth() - 1) / 2,
            y: index.y + (item.getRowHeight() - 1) / 2
        })
        item.setPosition(topRight.x, topRight.y)
    }

    getPositionForIndex(index: Vec2): Vec2 {
        return {
            x: this.x + index.x * this.colWidth + this.evenColsOffset,
            y: this.y + index.y * this.rowWidth + this.evenRowsOffset
        }
    }

    getIndexForPosition(pos: Vec2): Vec2 {
        return {
            x: Math.round((pos.x - this.evenColsOffset - this.x) / this.colWidth),
            y: Math.round((pos.y - this.evenRowsOffset - this.y) / this.rowWidth),
        }
    }

    showGrid() {
        this.freeFieldGraphics.setAlpha(1)
        this.usedFieldGraphics.setAlpha(1)
    }

    getItemAtIndex(index: Vec2): ConnectionPartner | undefined {
        return this.items.get(index)
    }

    private updateGridRender() {
        this.freeFieldGraphics.clear()
        this.usedFieldGraphics.clear()
        for (let x = -this.columns / 2; x <= this.columns / 2; x++) {
            for (let y = -this.rows / 2; y <= this.rows / 2; y++) {
                var index = {x: x, y: y}
                var pos = this.getPositionForIndex(index)
                if (this.items.has(index)) {
                    this.usedFieldGraphics.fillPoint(pos.x, pos.y, 5)
                } else {
                    this.freeFieldGraphics.fillPoint(pos.x, pos.y, 5)
                }

            }
        }
    }
}