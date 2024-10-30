import Phaser from "phaser";
import {Vec2, vec2Mean} from "../Helpers/Dict";
import {ConnectionPartner} from "../interfaces/ConnectionPartner";
import {Grid} from "./Grid";
import Graphics = Phaser.GameObjects.Graphics;
import QuadraticBezier = Phaser.Curves.QuadraticBezier;
import Line = Phaser.Curves.Line;
import Vector2 = Phaser.Math.Vector2;
import Path = Phaser.Curves.Path;

export class Connection extends Graphics {
    private indexPath: Vec2[] = []
    private start?: ConnectionPartner
    private end?: ConnectionPartner
    private inUse: boolean = false

    constructor(scene: Phaser.Scene) {
        super(scene, {
            lineStyle: {
                width: 7
            }
        })
        scene.add.existing(this)
    }

    isInUse(): boolean {
        return this.inUse;
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

    setEnd(end: ConnectionPartner) {
        this.end = end
    }

    setPath(path: Vec2[]) {
        this.indexPath = path
    }

    draw(grid: Grid) {
        // Drawing Path

        var pathsWithBetweens: Vec2[] = []
        for (let i = 0; i < this.indexPath.length - 1; i++) {
            pathsWithBetweens.push(this.indexPath[i], vec2Mean(this.indexPath[i], this.indexPath[i + 1]))
        }
        pathsWithBetweens.push(this.indexPath.at(-1)!)

        var switcherPositionPath = pathsWithBetweens.map(index => grid.getPositionForIndex(index))

        this.clear()
        var path = new Path();
        for (let i = 0; i < switcherPositionPath.length - 1; i++) {
            var first = switcherPositionPath[i]
            var second = switcherPositionPath[i + 1]
            var third = switcherPositionPath[i + 2]

            if (third && first.x != third.x && first.y != third.y) {
                path.add(new QuadraticBezier(new Vector2(first.x, first.y), new Vector2(second.x, second.y), new Vector2(third.x, third.y)))
                i += 1
            } else {
                path.add(new Line([first.x, first.y, second.x, second.y]))
            }
        }
        path.draw(this)
    }

    setInUse(value: boolean) {
        this.inUse = value
    }
}