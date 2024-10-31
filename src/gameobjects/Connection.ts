import Phaser from "phaser";
import {Vec2} from "../Helpers/Dict";
import {ConnectionPartner} from "../interfaces/ConnectionPartner";
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

    constructor(scene: Phaser.Scene) {
        super(scene)
        scene.add.existing(this)
        this.setDirectedWithPower(false)
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
            this.lineStyle(7, 0xffffff)
        } else{
            this.lineStyle(7, 0x1b3953)
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
                let startToEndDirection = this.getStart() == this.supplier
                this.fillStyle(startToEndDirection ? 0xff0000 : 0x00ff00)
                this.fillCircle(start.x, start.y, 7)
                this.fillStyle(startToEndDirection ? 0x00ff00: 0xff0000)
                this.fillCircle(last.x, last.y, 7)

            } else {
                // just put normal points
                this.fillStyle(0x1b3953)
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
}