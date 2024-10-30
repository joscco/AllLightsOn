import Container = Phaser.GameObjects.Container;
import Transform = Phaser.GameObjects.Components.Transform;
import {Scene} from "phaser";
import {Vec2, Vector2Dict,} from "../Helpers/Dict";

export class Grid<K extends Transform> extends Container {

    private columns: number
    private rows: number
    private colWidth: number
    private rowWidth: number
    private evenColsOffset: number
    private evenRowsOffset: number

    private graphics;

    private items: Vector2Dict<K> = new Vector2Dict();

    constructor(scene: Scene, x: number, y: number, columns: number, rows: number, colWidth: number, rowWidth: number) {
        super(scene, x, y);
        this.columns = columns
        this.rows = rows
        this.colWidth = colWidth
        this.rowWidth = rowWidth

        this.evenColsOffset = (this.columns % 2 == 0) ? this.colWidth / 2 : 0
        this.evenRowsOffset = (this.rows % 2 == 0) ? this.rowWidth / 2 : 0

        this.graphics = scene.add.graphics({
            fillStyle: {
                color: 0x1b3953
            }
        })

        for (let x = -columns / 2; x <= columns / 2; x++) {
            for (let y = -rows / 2; y <= rows / 2; y++) {
                var pos = this.getPositionForIndex({x: x, y: y})
                this.graphics.fillPoint(pos.x, pos.y, 5)
            }
        }
        this.graphics.setAlpha(0)
    }

    addAtIndex(index: Vec2, item: K) {
        this.items.set(index, item)
        var newPos = this.getPositionForIndex(index)
        item.setPosition(newPos.x, newPos.y)

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
        this.graphics.setAlpha(1)
    }
}