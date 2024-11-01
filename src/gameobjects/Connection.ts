import Phaser from "phaser";
import {Vec2, vec2Mean} from "../Helpers/Dict";
import {ConnectionPartner, GameColors} from "../interfaces/ConnectionPartner";
import Graphics = Phaser.GameObjects.Graphics;
import QuadraticBezier = Phaser.Curves.QuadraticBezier;
import Line = Phaser.Curves.Line;
import Vector2 = Phaser.Math.Vector2;
import Path = Phaser.Curves.Path;

export class Connection extends Graphics {
    private posPath: Vec2[] = []
    private start?: ConnectionPartner
    private end?: ConnectionPartner
    private supplier?: ConnectionPartner
    private consumer?: ConnectionPartner
    private directedWithPower: boolean = false

    private showingElectrons: boolean = false
    private lastElectronIndex: number = 0
    private electronGraphics: Graphics
    private electronMsPerNode = 50;
    private lastElectronChange: number

    constructor(scene: Phaser.Scene) {
        super(scene)
        scene.add.existing(this)
        this.setDirectedWithPower(false)
        this.lastElectronChange = scene.time.now
        this.electronGraphics = scene.add.graphics({
            fillStyle: {
                color: GameColors.LIGHT
            }
        })
        this.electronGraphics.setDepth(3)
    }

    getStart(): ConnectionPartner | undefined {
        return this.start;
    }

    setStart(start: ConnectionPartner) {
        this.start = start
    }

    getEnd(): ConnectionPartner | undefined {
        return this.end
    }

    setEnd(end: ConnectionPartner | undefined) {
        this.end = end
    }

    resetEnd() {
        this.end = undefined
    }

    isDirectedWithPower(): boolean {
        return this.directedWithPower;
    }

    checkDirection(from: ConnectionPartner, to: ConnectionPartner) {
        return this.supplier == from && this.consumer == to
    }

    setDirectedWithPower(val: boolean, from?: ConnectionPartner, to?: ConnectionPartner) {
        this.directedWithPower = val
        this.supplier = from
        this.consumer = to
        this.draw()
    }

    setPath(path: Vec2[]) {
        this.posPath = path
    }

    draw() {
        // Clearing path
        this.clear()
        // Setting color
        if (this.isDirectedWithPower()) {
            this.lineStyle(7, GameColors.ORANGE)
        } else{
            this.lineStyle(7, GameColors.DARK_BLUE)
        }
        // Redrawing path
        var path = new Path();
        for (let i = 0; i < this.posPath.length - 1; i++) {
            var first = this.posPath[i]
            var second = this.posPath[i + 1]
            var third = this.posPath[i + 2]

            if (third && first.x != third.x && first.y != third.y) {
                path.add(new QuadraticBezier(new Vector2(first.x, first.y), new Vector2(second.x, second.y), new Vector2(third.x, third.y)))
                i += 1
            } else {
                path.add(new Line([first.x, first.y, second.x, second.y]))
            }
        }
        path.draw(this)

        // Add endpoints
        if (this.posPath.length > 1) {
            let start = this.posPath[0]
            let last = this.posPath.at(-1)!

            if (this.isDirectedWithPower()) {
                // Start in red and end in green
                this.showingElectrons = true
                this.fillStyle(GameColors.LIGHT)
                this.fillCircle(start.x, start.y, 7)
                this.fillCircle(last.x, last.y, 7)

            } else {
                this.showingElectrons = false
                this.electronGraphics.clear()
                // just put normal points
                this.fillStyle(GameColors.DARK_BLUE)
                this.fillCircle(start.x, start.y, 7)
                this.fillCircle(last.x, last.y, 7)
            }
        }
    }

    getPartnerThatIsNot(unwanted: ConnectionPartner) {
        return [this.getEnd(), this.getStart()].find(el => el != unwanted)!
    }

    hasPartner(source: ConnectionPartner) {
        return this.getEnd() == source || this.getStart() == source
    }

    update(now: number) {
        if (this.showingElectrons && now > this.lastElectronChange + this.electronMsPerNode) {
            this.lastElectronChange = now
            this.electronGraphics.clear()

            var currentPosition = this.posPath[this.lastElectronIndex]
            var secondNextPosition = this.posPath[this.lastElectronIndex + 2]
            this.lastElectronIndex = (this.lastElectronIndex + 1) % this.posPath.length
            var nextPosition = this.posPath.at(this.lastElectronIndex)!
            let newPos: Vec2
            if (secondNextPosition && (currentPosition.x != secondNextPosition.x) && (currentPosition.y != secondNextPosition.y)) {
                // Next is corner, align it correctly to fit the bezier
                newPos = vec2Mean(nextPosition, vec2Mean(currentPosition, secondNextPosition))
            } else {
                newPos = nextPosition
            }

            this.electronGraphics.fillCircle(newPos.x, newPos.y, 6)
        }
    }
}