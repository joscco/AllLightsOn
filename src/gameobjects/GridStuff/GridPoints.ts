import {Scene} from "phaser";
import {TweenTimeline} from "../../Helpers/TweenTimeline";
import {GridSize} from "./GridConsts";
import {GameColors} from "../../interfaces/Item";
import {Vec2} from "../../Helpers/VecMath";
import {GAME_HEIGHT, GAME_WIDTH} from "../../index";
import Layer = Phaser.GameObjects.Layer;
import {DEPTHS} from "../../Helpers/Depths";

export const GRID_POINT_SIZE = 0.1;
export const GRID_POINT_COLOR = GameColors.BLUE;

export class GridPoints {
    private scene: Scene;
    private gridSize: GridSize;

    private gridPointsLayer: Layer
    private gridImage?: Phaser.GameObjects.Image;
    private pointPositions: Vec2[] = [];

    // Only relevant for fading. Replaced by gridImage afterwards
    private points: Phaser.GameObjects.Image[] = [];
    private gridPointsGraphics: Phaser.GameObjects.Graphics;
    private singleGridPointGraphics: Phaser.GameObjects.Graphics;

    constructor(scene: Scene, gridSize: GridSize) {
        this.scene = scene;
        this.gridSize = gridSize;
        this.gridPointsGraphics = this.scene.add.graphics({fillStyle: {color: GRID_POINT_COLOR}});
        this.singleGridPointGraphics = this.scene.add.graphics({fillStyle: {color: GRID_POINT_COLOR}});

        this.gridPointsLayer = this.scene.add.layer([this.gridPointsGraphics, this.singleGridPointGraphics]);
        this.gridPointsLayer.setDepth(DEPTHS.GRID);
    }

    private reset() {
        this.gridPointsGraphics.clear();
        this.singleGridPointGraphics.clear();
        this.gridImage?.destroy();
        this.points.forEach(point => point.destroy());
        this.points = [];
    }

    showGridPoints(pointPositions: Vec2[]) {
        this.reset();

        this.pointPositions = pointPositions;
        for (let pos of pointPositions) {
            this.gridPointsGraphics.fillCircle(pos.x, pos.y, GRID_POINT_SIZE * this.gridSize.unitSize);
        }
        if (this.scene.textures.exists("gridPointsTexture")) {
            this.scene.textures.remove("gridPointsTexture");
        }
        this.gridPointsGraphics.generateTexture('gridPointsTexture', GAME_WIDTH, GAME_HEIGHT);
        this.gridPointsGraphics.clear();
        this.gridImage = this.scene.add.image(0, 0, 'gridPointsTexture').setOrigin(0, 0);
        this.gridImage.setDepth(DEPTHS.GRID);
    }

    async fadeInGridPoints(pointPositions: Vec2[]) {
        this.reset();
        this.drawSingleGridPoints(pointPositions);
        this.points.forEach(point => {
            point.setScale(0);
            point.setAlpha(0);
        })

        // Fade in all these new grid points
        // Find the left top position of the grid points by taking minimum of all x and y values
        let leftTopPosition = this.findMinPoint(pointPositions);
        await new TweenTimeline({
            scene: this.scene,
            tweens: this.points.map(point => {
                return {
                    at: 0.5 * ((point.x - leftTopPosition.x) + (point.y - leftTopPosition.y)),
                    targets: point,
                    scale: 1,
                    alpha: 1,
                    duration: 200
                };
            }),
            onComplete: () => {
                this.showGridPoints(pointPositions);
            }
        }).asPromise();
    }

    private drawSingleGridPoints(pointPositions: Vec2[]) {
        // Draw single grid point as reference
        let gridPointRadius = GRID_POINT_SIZE * this.gridSize.unitSize;
        this.gridPointsGraphics.fillCircle(gridPointRadius, gridPointRadius, gridPointRadius);
        if (this.scene.textures.exists("singleGridPointTexture")) {
            this.scene.textures.remove("singleGridPointTexture");
        }
        this.gridPointsGraphics.generateTexture('singleGridPointTexture', 2 * gridPointRadius, 2 * gridPointRadius);
        this.gridPointsGraphics.clear();

        // Use this reference to draw all (invisible) grid points and save them in points
        for (let pos of pointPositions) {
            const point = this.scene.add.image(pos.x, pos.y, 'singleGridPointTexture');
            this.points.push(point);
        }
    }

    hideGridPoints() {
        this.reset();
    }

    async fadeOutGridPoints() {
        this.reset()
        this.drawSingleGridPoints(this.pointPositions);
        let leftTopPosition = this.findMinPoint(this.pointPositions);
        await new TweenTimeline({
            scene: this.scene,
            tweens: this.points.map(point => {
                return {
                    at: 0.5 * ((point.x - leftTopPosition.x) + (point.y - leftTopPosition.y)),
                    targets: point,
                    scale: 0,
                    alpha: 0,
                    duration: 200
                };
            }),
            onComplete: () => {
                this.reset();
            }
        }).asPromise();
    }

    private findMinPoint(pointPositions: Vec2[]) {
        let minX = pointPositions[0].x;
        let minY = pointPositions[0].y;
        for (let pos of pointPositions) {
            minX = Math.min(minX, pos.x);
            minY = Math.min(minY, pos.y);
        }
        return {x: minX, y: minY};
    }

    setGridSize(gridSize: GridSize) {
        this.gridSize = gridSize;
    }
}