import Phaser from "phaser";
import {GameColors, Item} from "../interfaces/Item";
import {mod, Vec2, vec2Equals, vec2Mean} from "../Helpers/VecMath";
import Graphics = Phaser.GameObjects.Graphics;
import QuadraticBezier = Phaser.Curves.QuadraticBezier;
import Line = Phaser.Curves.Line;
import Vector2 = Phaser.Math.Vector2;
import Path = Phaser.Curves.Path;
import Image = Phaser.GameObjects.Image;
import Container = Phaser.GameObjects.Container;
import {DEPTHS} from "../Helpers/Depths";

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
    private t: number = 0
    private lastElectronIndex: number = -1
    private electronMoveTween?: Phaser.Tweens.Tween
    private electronImage: Image
    private electronMsPerNode: number = 80;
    private minWaitingTimeForNextElectron = 1000;
    private lastElectronChange: number
    private lastRoundStart: number;
    private lineSize: number
    private connectorPointSize: number
    private electronTimerEvent?: Phaser.Time.TimerEvent;

    constructor(scene: Phaser.Scene, gridUnitSize: number) {
        super(scene)
        scene.add.existing(this)
        this.lastElectronChange = scene.time.now
        this.lastRoundStart = scene.time.now
        this.pathGraphics = scene.add.graphics()
        this.pathGraphics.setDepth(DEPTHS.CONNECTIONS)
        this.onGraph = scene.add.image(0, 0, "").setOrigin(0, 0)
        this.onGraph.setVisible(false)
        this.onGraph.setDepth(DEPTHS.CONNECTIONS)
        this.offGraph = scene.add.image(0, 0, "").setOrigin(0, 0)
        this.offGraph.setVisible(false)
        this.offGraph.setDepth(DEPTHS.CONNECTIONS)

        this.lineSize = gridUnitSize * LINE_SIZE
        this.connectorPointSize = gridUnitSize * CONNECTOR_INSIDE_POINT_SIZE

        this.electronImage = scene.add.image(0, 0, "electron")
        this.electronImage.setScale(0)
        this.electronImage.setDepth(DEPTHS.ELECTRONS)
        this.add([this.onGraph, this.offGraph, this.pathGraphics, this.electronImage])

        this.createElectronTimer();
    }

    private createElectronTimer() {
        this.electronTimerEvent = this.scene.time.addEvent({
            delay: this.electronMsPerNode,
            callback: this.updateElectronPosition,
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

    setPath(posPath: Vec2[], indexPath: Vec2[]) {
        this.posPath = posPath
        this.indexPath = indexPath
        this.graphicsPath = this.calculateGraphicsPath()
    }

    draw() {
        if (!this.isDirectedWithPower() || !this.end) {
            this.showingElectrons = false
            this.electronImage.setScale(0)
            this.lastElectronIndex = -1
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

    private updateElectronPosition() {
        if (!this.showingElectrons) {
            return;
        }

        this.electronImage.setScale(1)
        this.t = (this.t +  0.1) % 1
        let point = this.graphicsPath!.getPoint(this.t)
        this.electronImage.setPosition(point.x, point.y)

        // if (isAtEnd || wasUndefined) {
        //     this.electronImage.setPosition(newPos.x, newPos.y)
        // } else if (isAtOneBeforeEnd) {
        //     this.electronMoveTween?.stop()
        //     this.electronMoveTween = this.scene.tweens.add({
        //         targets: this.electronImage,
        //         scaleX: 0.05,
        //         scaleY: 0.05,
        //         alpha: 0.05,
        //         x: newPos.x,
        //         y: newPos.y,
        //         duration: this.electronMsPerNode,
        //         ease: Phaser.Math.Easing.Sine.In
        //     })
        // } else {
        //     this.electronMoveTween?.stop()
        //     this.electronMoveTween = this.scene.tweens.add({
        //         targets: this.electronImage,
        //         scaleX: 1,
        //         scaleY: 1,
        //         alpha: 1,
        //         x: newPos.x,
        //         y: newPos.y,
        //         duration: this.electronMsPerNode,
        //         ease: Phaser.Math.Easing.Linear
        //     })
        // }

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
                    this.reducePath()
                    this.graphicsPath = this.calculateGraphicsPath()
                    this.drawGraphics()
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

    // Will make the connection quicker to render by generating textures and eliminating the graphics
    fixate() {
        if (!this.startIsSource) {
            this.posPath = this.posPath.reverse()
            this.indexPath = this.indexPath.reverse()
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
}