import Phaser from "phaser";
import {Vec2, vec2Mean} from "../Helpers/Dict";
import {ConnectionPartner} from "../interfaces/ConnectionPartner";
import Graphics = Phaser.GameObjects.Graphics;
import QuadraticBezier = Phaser.Curves.QuadraticBezier;
import Line = Phaser.Curves.Line;
import Vector2 = Phaser.Math.Vector2;
import Path = Phaser.Curves.Path;
import {Grid} from "./Grid";
import Container = Phaser.GameObjects.Container;

export class Connection extends Container{
    private indexPath: Vec2[] = []
    private firstEnd?: ConnectionPartner
    private secondEnd?: ConnectionPartner
    private inUse: boolean = false

    private graphics: Graphics

    constructor(scene: Phaser.Scene) {
        super(scene)
        scene.add.existing(this)
        this.graphics = scene.add.graphics({
            lineStyle: {
                width: 7
            }
        })
        this.add(this.graphics)
    }
    
    isInUse(): boolean {
        return this.inUse;
    }

    setPath(path: Vec2[]) {
        this.indexPath = path
    }
    
    draw(grid: Grid<any>) {
        // Drawing Path
        this.graphics.clear()
        var pathsWithBetweens: Vec2[] = []
        for (let i = 0; i < this.indexPath.length - 1; i++) {
            pathsWithBetweens.push(this.indexPath[i], vec2Mean(this.indexPath[i], this.indexPath[i+1]))
        }
        pathsWithBetweens.push(this.indexPath.at(-1)!)

        var switcherPositionPath = pathsWithBetweens.map(index => grid.getPositionForIndex(index))
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

        path.draw(this.graphics)
    }
}