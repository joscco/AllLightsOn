import Phaser from "phaser";
import {GameColors, Item} from "../interfaces/Item";
import {mod, Vec2, vec2Equals, vec2Mean} from "../Helpers/VecMath";
import {
    CONNECTOR_INSIDE_POINT_SIZE,
    ELECTRON_COLOR,
    ELECTRON_SIZE,
    IN_CONNECTOR_INNER_UNUSED_COLOR,
    IN_CONNECTOR_INNER_USED_COLOR,
    OUT_CONNECTOR_INNER_UNUSED_COLOR,
    OUT_CONNECTOR_INNER_USED_COLOR,
    UNUSED_CONNECTION_COLOR,
    USED_CONNECTION_COLOR
} from "./Grid";
import Graphics = Phaser.GameObjects.Graphics;
import QuadraticBezier = Phaser.Curves.QuadraticBezier;
import Line = Phaser.Curves.Line;
import Vector2 = Phaser.Math.Vector2;
import Path = Phaser.Curves.Path;

export enum PowerInfo {
    NO_INFO,
    POWER_OFF,
    POWER_ON
}

export class Connection extends Graphics {
    private indexPath: Vec2[] = []
    private posPath: Vec2[] = []
    private start?: Item
    private end?: Item
    private directedWithPower: PowerInfo = PowerInfo.NO_INFO

    // Only set after connection is added
    private source?: Item
    private sourceIndex?: Vec2
    private consumer?: Item
    private consumerIndex?: Vec2
    private startIsSource?: boolean

    private showingElectrons: boolean = false
    private lastElectronIndex: number = 0
    private electronGraphics: Graphics
    private electronMsPerNode = 50;
    private lastElectronChange: number

    constructor(scene: Phaser.Scene) {
        super(scene)
        scene.add.existing(this)
        this.lastElectronChange = scene.time.now
        this.electronGraphics = scene.add.graphics({
            fillStyle: {
                color: ELECTRON_COLOR
            }
        })
        this.electronGraphics.setDepth(3)
    }

    getStart(): Item | undefined {
        return this.start;
    }

    setStart(start: Item) {
        this.start = start
    }

    getEnd(): Item | undefined {
        return this.end
    }

    setEnd(end: Item | undefined) {
        this.end = end
    }

    resetEnd() {
        this.end = undefined
    }

    isDirectedWithPower(): boolean {
        return this.directedWithPower == PowerInfo.POWER_ON;
    }

    getPowerInfo(): PowerInfo {
        return this.directedWithPower
    }

    setDirectedWithPower(val: PowerInfo) {
        this.directedWithPower = val
        this.draw()
    }

    setPath(posPath: Vec2[], indexPath: Vec2[]) {
        this.posPath = posPath
        this.indexPath = indexPath
    }

    draw() {
        // Clearing path
        this.clear()
        // Setting color
        if (this.getPowerInfo() == PowerInfo.POWER_ON) {
            this.lineStyle(7, USED_CONNECTION_COLOR)
        } else {
            this.lineStyle(7, UNUSED_CONNECTION_COLOR)
        }
        // Redrawing path
        let path = new Path();
        for (let i = 0; i < this.posPath.length - 1; i++) {
            let first = this.posPath[i]
            let second = this.posPath[i + 1]
            let third = this.posPath[i + 2]

            if (third && first.x != third.x && first.y != third.y) {
                path.add(new QuadraticBezier(new Vector2(first.x, first.y), new Vector2(second.x, second.y), new Vector2(third.x, third.y)))
                i += 1
            } else {
                path.add(new Line([first.x, first.y, second.x, second.y]))
            }
        }
        path.draw(this)

        // Add endpoints
        if (this.posPath.length > 0) {
            if (!this.end) {
                // Still in move mode
                this.showingElectrons = false
                this.electronGraphics.clear()
                // just put normal points
                let start = this.posPath[0]
                let end = this.posPath.at(-1)!
                this.fillStyle(OUT_CONNECTOR_INNER_UNUSED_COLOR)
                this.fillCircle(start.x, start.y, CONNECTOR_INSIDE_POINT_SIZE)
                if (!vec2Equals(start, end)) {
                    this.fillStyle(GameColors.ORANGE)
                    this.fillCircle(end.x, end.y, CONNECTOR_INSIDE_POINT_SIZE)
                }
                return
            }

            // Connection is complete
            let sourcePosition = this.startIsSource ? this.posPath[0] : this.posPath.at(-1)!
            let consumerPosition = this.startIsSource ? this.posPath.at(-1)! : this.posPath[0]

            if (this.isDirectedWithPower()) {
                // Start in red and end in green
                this.showingElectrons = true
                this.fillStyle(OUT_CONNECTOR_INNER_USED_COLOR)
                this.fillCircle(sourcePosition.x, sourcePosition.y, CONNECTOR_INSIDE_POINT_SIZE)
                this.fillStyle(IN_CONNECTOR_INNER_USED_COLOR)
                this.fillCircle(consumerPosition.x, consumerPosition.y, CONNECTOR_INSIDE_POINT_SIZE)
            } else {
                this.showingElectrons = false
                this.electronGraphics.clear()
                // just put normal points
                this.fillStyle(OUT_CONNECTOR_INNER_UNUSED_COLOR)
                this.fillCircle(sourcePosition.x, sourcePosition.y, CONNECTOR_INSIDE_POINT_SIZE)
                this.fillStyle(IN_CONNECTOR_INNER_UNUSED_COLOR)
                this.fillCircle(consumerPosition.x, consumerPosition.y, CONNECTOR_INSIDE_POINT_SIZE)
            }
        }
    }

    update(now: number) {
        if (this.showingElectrons && now > this.lastElectronChange + this.electronMsPerNode) {
            this.lastElectronChange = now
            this.electronGraphics.clear()

            let currentPosition = this.posPath[this.lastElectronIndex]
            let secondNextPosition: Vec2
            if (this.startIsSource) {
                secondNextPosition = this.posPath[this.lastElectronIndex + 2]
                this.lastElectronIndex = mod(this.lastElectronIndex + 1, this.posPath.length)
            } else {
                secondNextPosition = this.posPath[this.lastElectronIndex - 2]
                this.lastElectronIndex = mod(this.lastElectronIndex - 1, this.posPath.length)
            }

            var nextPosition = this.posPath.at(this.lastElectronIndex)!
            let newPos: Vec2
            if (secondNextPosition && (currentPosition.x != secondNextPosition.x) && (currentPosition.y != secondNextPosition.y)) {
                // Next is corner, align it correctly to fit the bezier
                newPos = vec2Mean(nextPosition, vec2Mean(currentPosition, secondNextPosition))
            } else {
                newPos = nextPosition
            }

            this.electronGraphics.fillCircle(newPos.x, newPos.y, ELECTRON_SIZE)
        }
    }

    getStartIndex() {
        return this.indexPath[0]
    }

    getEndIndex() {
        return this.indexPath.at(-1)
    }

    setSourceAndConsumerData(startIsSource: boolean) {
        this.startIsSource = startIsSource
        this.source = startIsSource ? this.getStart()! : this.getEnd()!;
        this.sourceIndex = startIsSource ? this.getStartIndex() : this.getEndIndex()!;
        this.consumer = startIsSource ? this.getEnd()! : this.getStart()!;
        this.consumerIndex = startIsSource ? this.getEndIndex()! : this.getStartIndex();
    }

    getSourceIndex() {
        return this.sourceIndex
    }

    getConsumerIndex() {
        return this.consumerIndex
    }

    getSource() {
        return this.source
    }

    getConsumer() {
        return this.consumer
    }

    getStartIsSource() {
        return this.startIsSource
    }
}