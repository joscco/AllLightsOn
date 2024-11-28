import Phaser from "phaser";
import {GameColors, Item} from "../interfaces/Item";
import {Vec2, vec2Equals} from "../Helpers/VecMath";
import {DEPTHS} from "../Helpers/Depths";
import Graphics = Phaser.GameObjects.Graphics;
import QuadraticBezier = Phaser.Curves.QuadraticBezier;
import Line = Phaser.Curves.Line;
import Vector2 = Phaser.Math.Vector2;
import Path = Phaser.Curves.Path;
import Image = Phaser.GameObjects.Image;
import Container = Phaser.GameObjects.Container;
import {GridSize} from "./GridStuff/GridConsts";

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

export const CONNECTOR_INSIDE_POINT_SIZE = 0.2
export const LINE_SIZE = 0.18

export class Connection extends Container {
    private indexPath: Vec2[] = []
    private posPath: Vec2[] = []
    private graphicsPath?: Path
    private start?: Item
    private end?: Item
    private directedWithPower: PowerInfo = PowerInfo.NO_INFO

    // Only set after connection is added
    private source?: Item
    private sourceIndex?: Vec2
    private consumer?: Item
    private consumerIndex?: Vec2
    private startIsSource?: boolean

    private isFixated: boolean = false
    private onGraph: Image
    private offGraph: Image
    private pathGraphics: Graphics

    private showingElectrons: boolean = false
    private electronIndex: number = 0
    private maxElectronScale: number = 1
    private subStepsPerNode: number = 4;
    private lastElectronRoundStart: number = 0
    private electronImage: Image
    private electronMsPerNode: number = 100;
    private minWaitingTimeForNextElectron = 1000;
    private lineSize: number = 0
    private connectorPointSize: number = 0
    private electronTimerEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene) {
        super(scene)
        scene.add.existing(this)
        this.pathGraphics = scene.add.graphics()
        this.pathGraphics.setDepth(DEPTHS.CONNECTIONS)
        this.onGraph = scene.add.image(0, 0, "").setOrigin(0, 0)
        this.onGraph.setVisible(false)
        this.onGraph.setDepth(DEPTHS.CONNECTIONS)
        this.offGraph = scene.add.image(0, 0, "").setOrigin(0, 0)
        this.offGraph.setVisible(false)
        this.offGraph.setDepth(DEPTHS.CONNECTIONS)

        this.electronImage = scene.add.image(0, 0, "electron")

        this.electronImage.setScale(0)
        this.electronImage.setDepth(DEPTHS.ELECTRONS)
        this.add([this.onGraph, this.offGraph, this.pathGraphics, this.electronImage])

        this.createElectronTimer();
    }

    setStartIsSource(startIsSource: boolean) {
        this.startIsSource = startIsSource
    }

    setGridSize(gridSize: GridSize) {
        let unitSize = gridSize.unitSize
        this.lineSize = unitSize * LINE_SIZE
        this.connectorPointSize = unitSize * CONNECTOR_INSIDE_POINT_SIZE
        this.maxElectronScale = gridSize.relativeScale
    }

    draw(newPosPath?: Vec2[], newIndexPath?: Vec2[]) {
        if (newPosPath) {
            this.posPath = newPosPath
            this.graphicsPath = this.calculateGraphicsPath()
        }

        if (newIndexPath) {
            this.indexPath = newIndexPath
        }

        if (!this.isDirectedWithPower() || !this.end) {
            this.showingElectrons = false
            this.electronImage.setScale(0)
            this.electronIndex = 0
        } else {
            this.showingElectrons = true
        }

        if (this.isFixated) {
            this.drawImages()
        } else {
            this.drawGraphics()
        }
    }

    private drawImages() {
        if (this.getPowerInfo() == PowerInfo.POWER_ON) {
            this.onGraph.setVisible(true)
            this.offGraph.setVisible(false)
        } else {
            this.onGraph.setVisible(false)
            this.offGraph.setVisible(true)
        }
    }

    private drawGraphics() {
        this.onGraph.setVisible(false)
        this.offGraph.setVisible(false)
        // Clearing path
        this.pathGraphics.clear()
        // Setting color
        if (this.getPowerInfo() == PowerInfo.POWER_ON) {
            this.pathGraphics.lineStyle(this.lineSize, USED_CONNECTION_COLOR)
        } else {
            this.pathGraphics.lineStyle(this.lineSize, UNUSED_CONNECTION_COLOR)
        }

        // Drawing path
        this.graphicsPath!.draw(this.pathGraphics)

        // Add endpoints
        if (this.posPath.length == 0) {
            return;
        }

        // Drawing endpoints
        if (!this.end) {
            // just put normal points
            let start = this.posPath[0]
            let end = this.posPath.at(-1)!
            this.pathGraphics.fillStyle(OUT_CONNECTOR_INNER_UNUSED_COLOR)
            this.pathGraphics.fillCircle(start.x, start.y, this.connectorPointSize)
            if (!vec2Equals(start, end)) {
                this.pathGraphics.fillStyle(GameColors.ORANGE)
                this.pathGraphics.fillCircle(end.x, end.y, this.connectorPointSize)
            }
            return
        }

        // Connection is complete
        let sourcePosition = this.startIsSource ? this.posPath[0] : this.posPath.at(-1)!
        let consumerPosition = this.startIsSource ? this.posPath.at(-1)! : this.posPath[0]

        if (this.isDirectedWithPower()) {
            // Start in red and end in green
            this.pathGraphics.fillStyle(OUT_CONNECTOR_INNER_USED_COLOR)
            this.pathGraphics.fillCircle(sourcePosition.x, sourcePosition.y, this.connectorPointSize)
            this.pathGraphics.fillStyle(IN_CONNECTOR_INNER_USED_COLOR)
            this.pathGraphics.fillCircle(consumerPosition.x, consumerPosition.y, this.connectorPointSize)
        } else {
            // just put normal points
            this.pathGraphics.fillStyle(OUT_CONNECTOR_INNER_UNUSED_COLOR)
            this.pathGraphics.fillCircle(sourcePosition.x, sourcePosition.y, this.connectorPointSize)
            this.pathGraphics.fillStyle(IN_CONNECTOR_INNER_UNUSED_COLOR)
            this.pathGraphics.fillCircle(consumerPosition.x, consumerPosition.y, this.connectorPointSize)
        }
    }

    // Will make the connection quicker to render by generating textures and eliminating the graphics
    fixate(newPosPath?: Vec2[]) {
        this.source = this.startIsSource ? this.getStart()! : this.getEnd()!;
        this.sourceIndex = this.startIsSource ? this.getStartIndex() : this.getEndIndex()!;
        this.consumer = this.startIsSource ? this.getEnd()! : this.getStart()!;
        this.consumerIndex = this.startIsSource ? this.getEndIndex()! : this.getStartIndex();

        if (newPosPath) {
            this.posPath = newPosPath
            this.graphicsPath = this.calculateGraphicsPath()
        }

        if (!this.startIsSource) {
            this.start = this.source
            this.end = this.consumer
            this.indexPath = this.indexPath.reverse()
            this.posPath = this.posPath.reverse()
            this.graphicsPath = this.calculateGraphicsPath()
            this.startIsSource = true
        }

        this.setDirectedWithPower(PowerInfo.POWER_ON)
        this.drawGraphics()
        let onKey = "connection_on_" + this.sourceIndex!.x + "_" + this.sourceIndex!.y
        this.scene.textures.removeKey(onKey)
        this.pathGraphics.generateTexture(onKey)
        this.onGraph.setTexture(onKey)

        this.setDirectedWithPower(PowerInfo.POWER_OFF)
        this.drawGraphics()
        let offKey = "connection_off_" + this.sourceIndex!.x + "_" + this.sourceIndex!.y
        this.scene.textures.removeKey(offKey)
        this.pathGraphics.generateTexture(offKey)
        this.offGraph.setTexture(offKey)

        this.pathGraphics.clear()
        this.isFixated = true
    }

    private calculateGraphicsPath(): Path {
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
        return path
    }

    private createElectronTimer() {
        this.electronTimerEvent = this.scene.time.addEvent({
            delay: this.electronMsPerNode / this.subStepsPerNode,
            callback: () => {
                this.updateElectronPosition()
            },
            callbackScope: this,
            loop: true
        });
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

    private updateElectronPosition() {
        if (!this.showingElectrons) {
            return;
        }

        let positionsPerPath = this.posPath.length * this.subStepsPerNode

        if (this.electronIndex < positionsPerPath) {
            this.electronIndex = this.electronIndex + 1
        } else {
            let now = this.scene.time.now
            if (now > (this.lastElectronRoundStart + this.minWaitingTimeForNextElectron)) {
                this.lastElectronRoundStart = now
                this.electronIndex = 0
            }
        }

        if (this.electronIndex <= positionsPerPath) {
            let t = this.electronIndex / positionsPerPath
            let point = this.graphicsPath!.getPoint(t)
            let minOffset = 3
            let stepsToEnd = Math.min(this.electronIndex, positionsPerPath - this.electronIndex)
            let farEnoughtFromEnds = stepsToEnd > minOffset
            this.electronImage.setScale(farEnoughtFromEnds ? this.maxElectronScale : (this.maxElectronScale * stepsToEnd / minOffset))
            this.electronImage.setAlpha(farEnoughtFromEnds ? 1 : stepsToEnd / minOffset)
            this.electronImage.setPosition(point.x, point.y)
        }
    }

    isConnectedTo(item: Item): boolean {
        return this.start == item || this.end == item
    }

    getStartIndex() {
        return this.indexPath[0]
    }

    getEndIndex() {
        return this.indexPath.at(-1)
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

    getIndexPath() {
        return this.indexPath
    }

    kill(immediate: boolean = false) {
        this.electronImage.destroy()
        this.electronTimerEvent?.destroy()
        this.onGraph.destroy()
        this.offGraph.destroy()
        if (immediate) {
            this.destroy()
        } else {
            let fullPositionPath = this.posPath
            let interval = setInterval(() => {
                if (fullPositionPath.length == 0) {
                    clearInterval(interval)
                    this.pathGraphics.destroy()
                    this.destroy()
                } else {
                    this.reducePosPathByOne()
                    this.graphicsPath = this.calculateGraphicsPath()
                    this.drawGraphics()
                }
            }, Math.min(50, 300 / this.posPath.length))
        }
    }

    private reducePosPathByOne() {
        this.posPath = this.posPath.slice(0, this.posPath.length - 1)
    }
}