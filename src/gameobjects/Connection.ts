import Phaser from "phaser";
import {GameColors, Item} from "../interfaces/Item";
import {mod, Vec2, vec2Equals, vec2Mean} from "../Helpers/VecMath";
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

export const IN_CONNECTOR_INNER_USED_COLOR = GameColors.DARK_BLUE
export const IN_CONNECTOR_INNER_UNUSED_COLOR = GameColors.DARK_BLUE
export const OUT_CONNECTOR_INNER_USED_COLOR = GameColors.DARK_BLUE
export const OUT_CONNECTOR_INNER_UNUSED_COLOR = GameColors.DARK_BLUE
export const UNUSED_CONNECTION_COLOR = GameColors.ORANGE
export const USED_CONNECTION_COLOR = GameColors.LIGHT_ORANGE
export const ELECTRON_COLOR = GameColors.LIGHT

export const CONNECTOR_INSIDE_POINT_SIZE = 0.2
export const ELECTRON_SIZE = 0.2
export const LINE_SIZE = 0.18

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
    private electronMsPerNode: number = 50;
    private minWaitingTimeForNextElectron = 500;
    private lastElectronChange: number
    private lastRoundStart: number;
    private lineSize: number
    private electronSize: number
    private connectorPointSize: number

    constructor(scene: Phaser.Scene, gridUnitSize: number) {
        super(scene)
        scene.add.existing(this)
        this.lastElectronChange = scene.time.now
        this.lastRoundStart = scene.time.now
        this.electronGraphics = scene.add.graphics({
            fillStyle: {
                color: ELECTRON_COLOR
            }
        })
        this.electronGraphics.setDepth(2)
        this.lineSize = gridUnitSize * LINE_SIZE
        this.electronSize = gridUnitSize * ELECTRON_SIZE
        this.connectorPointSize = gridUnitSize * CONNECTOR_INSIDE_POINT_SIZE
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
            this.lineStyle(this.lineSize, USED_CONNECTION_COLOR)
        } else {
            this.lineStyle(this.lineSize, UNUSED_CONNECTION_COLOR)
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
                this.fillCircle(start.x, start.y, this.connectorPointSize)
                if (!vec2Equals(start, end)) {
                    this.fillStyle(GameColors.ORANGE)
                    this.fillCircle(end.x, end.y, this.connectorPointSize)
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
                this.fillCircle(sourcePosition.x, sourcePosition.y, this.connectorPointSize)
                this.fillStyle(IN_CONNECTOR_INNER_USED_COLOR)
                this.fillCircle(consumerPosition.x, consumerPosition.y, this.connectorPointSize)
            } else {
                this.showingElectrons = false
                this.electronGraphics.clear()
                // just put normal points
                this.fillStyle(OUT_CONNECTOR_INNER_UNUSED_COLOR)
                this.fillCircle(sourcePosition.x, sourcePosition.y, this.connectorPointSize)
                this.fillStyle(IN_CONNECTOR_INNER_UNUSED_COLOR)
                this.fillCircle(consumerPosition.x, consumerPosition.y, this.connectorPointSize)
            }
        }
    }

    update(now: number) {

        if (this.showingElectrons && now > this.lastElectronChange + this.electronMsPerNode) {
            this.lastElectronChange = now

            this.electronGraphics.clear()
            let isAtEnd = this.startIsSource
                ? (this.lastElectronIndex == this.posPath.length - 1)
                : (this.lastElectronIndex == 0)
            if (isAtEnd && now < this.lastRoundStart + this.minWaitingTimeForNextElectron) {
                // Last position was reached and new electron cannot be fired. Wait
                return
            }

            let isAtStart = this.startIsSource
                ? (this.lastElectronIndex == 0)
                : (this.lastElectronIndex == this.posPath.length - 1)
            if (isAtStart) {
                this.lastRoundStart = now
            }

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

            this.electronGraphics.fillCircle(newPos.x, newPos.y, this.electronSize)
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

    getIndexPath() {
        return this.indexPath
    }

    kill(immediate: boolean = false) {
        this.electronGraphics.destroy()
        if (immediate) {
            this.destroy()
        } else {
            let fullPositionPath = this.posPath
            let interval = setInterval(() => {
                if (fullPositionPath.length == 0) {
                    clearInterval(interval)
                    this.destroy()
                } else {
                    this.reducePath()
                    this.draw()
                }
            }, 150 / this.posPath.length)
        }

    }

    private reducePath() {
        if (this.startIsSource) {
            this.posPath = this.posPath.slice(1, this.posPath.length)
        } else {
            this.posPath = this.posPath.slice(0, this.posPath.length - 1)
        }
    }
}