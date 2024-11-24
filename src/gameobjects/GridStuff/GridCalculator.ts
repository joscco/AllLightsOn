import {GridSize} from "./GridConsts";
import {Vec2} from "../../Helpers/VecMath";
import Clamp = Phaser.Math.Clamp;

export class GridCalculator {
    private minColIndex: number = 0;
    private maxColIndex: number = 0;
    private minRowIndex: number = 0;
    private maxRowIndex: number = 0;
    private colWidth: number = 0;
    private rowWidth: number = 0;
    private evenColsOffset: number = 0;
    private evenRowsOffset: number = 0;

    constructor(
        private x: number,
        private y: number,
        private columns: number,
        private rows: number,
        private gridSize: GridSize
    ) {
        this.colWidth = gridSize.unitSize;
        this.rowWidth = gridSize.unitSize;
        this.minColIndex = -Math.floor((this.columns - 1) / 2);
        this.maxColIndex = Math.ceil((this.columns - 1) / 2);
        this.minRowIndex = -Math.floor((this.rows - 1) / 2);
        this.maxRowIndex = Math.ceil((this.rows - 1) / 2);
        this.evenColsOffset = ((this.columns - 1) % 2 == 0) ? 0 : -this.colWidth / 2;
        this.evenRowsOffset = ((this.rows - 1) % 2 == 0) ? 0 : -this.rowWidth / 2;
    }

    getPositionForIndex(index: Vec2): Vec2 {
        return {
            x: this.x + index.x * this.colWidth + this.evenColsOffset,
            y: this.y + index.y * this.rowWidth + this.evenRowsOffset
        };
    }

    getIndexForPosition(pos: Vec2): Vec2 {
        return {
            x: Clamp(Math.round((pos.x - this.evenColsOffset - this.x) / this.colWidth), this.minColIndex, this.maxColIndex),
            y: Clamp(Math.round((pos.y - this.evenRowsOffset - this.y) / this.rowWidth), this.minRowIndex, this.maxRowIndex)
        };
    }

    getPointPositions() {
        let result = []
        for (let i = this.minColIndex; i <= this.maxColIndex; i++) {
            for (let j = this.minRowIndex; j <= this.maxRowIndex; j++) {
                result.push(this.getPositionForIndex({x: i, y: j}));
            }
        }
        return result;
    }

    getPotentialNeighbors(v: Vec2): Vec2[] {
        return [{x: v.x - 1, y: v.y}, {x: v.x + 1, y: v.y}, {x: v.x, y: v.y - 1}, {x: v.x, y: v.y + 1}]
            .filter(index => index.x >= this.minColIndex
                && index.x <= this.maxColIndex
                && index.y >= this.minRowIndex
                && index.y <= this.maxRowIndex)
    }
}