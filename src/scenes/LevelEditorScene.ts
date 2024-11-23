import Phaser from 'phaser';
import {Grid, GridSize, GridSizes} from '../gameobjects/Grid';
import {LevelConfig} from '../levels/LevelConfig';
import {GridInteractionHandler} from '../gameobjects/GridInteractionHandler';
import {Power} from '../gameobjects/Items/Power';
import {Light} from '../gameobjects/Items/Light';
import {Stopper} from '../gameobjects/Items/Stopper';
import {And} from '../gameobjects/Items/And';
import {Or} from '../gameobjects/Items/Or';
import {Not} from '../gameobjects/Items/Not';
import {Splitter} from '../gameobjects/Items/Splitter';
import {SwitchIn} from '../gameobjects/Items/SwitchIn';
import {SwitchOut} from '../gameobjects/Items/SwitchOut';
import {GAME_HEIGHT, GAME_WIDTH} from '../index';
import {PowerForwarder} from "../gameobjects/PowerForwarder";
import {PowerInfo} from "../gameobjects/Connection";
import {Vec2} from "../Helpers/VecMath";

const TEXT_STYLE = {
    fontFamily: "ItemFont",
    fontSize: 60
};

export class LevelEditorScene extends Phaser.Scene {
    private grid?: Grid;
    private gridInteractionHandler?: GridInteractionHandler;
    private powerForwarder?: PowerForwarder;
    private levelData: LevelConfig = {
        title: "New Level",
        size: GridSizes.M,
        rows: 6,
        columns: 12,
        items: [],
        connections: []
    };

    constructor(key: string = 'LevelEditorScene') {
        super({key: key});
    }

    create() {
        this.createHeading("Level Editor");
        this.createGrid(this.levelData.columns, this.levelData.rows, this.levelData.size!);
        this.createToolMenu();
        this.createGridDimensionButtons();
        this.powerForwarder = new PowerForwarder(this.grid!);
    }

    private createHeading(heading: string) {
        let text = this.add.text(GAME_WIDTH / 2, 50, heading, TEXT_STYLE);
        text.setOrigin(0.5, 0.5);
    }

    private createGrid(columns: number, rows: number, size: GridSize) {
        this.grid = new Grid(
            this,
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 - 100,
            columns, rows,
            size
        );
        this.grid.fadeInGrid();
        this.gridInteractionHandler = new GridInteractionHandler(
            this,
            this.grid,
            () => this.checkSources()
        );
    }

    private createToolMenu() {
        const toolMenu = this.add.container(0, GAME_HEIGHT - 100);
        const items = [
            {type: 'Power', texture: 'powerTexture'},
            {type: 'Light', texture: 'lightTexture'},
            {type: 'Stopper', texture: 'stopperTexture'},
            {type: 'And', texture: 'andTexture'},
            {type: 'Or', texture: 'orTexture'},
            {type: 'Not', texture: 'notTexture'},
            {type: 'Splitter', texture: 'splitterTexture'},
            {type: 'SwitchIn', texture: 'switchInTexture'},
            {type: 'SwitchOut', texture: 'switchOutTexture'}
        ];

        items.forEach((item, index) => {
            const button = this.add.image(50 + index * 100, 50, item.texture).setInteractive();
            this.input.setDraggable(button);
            button.on('dragstart', () => {
                button.setAlpha(0.5);
            });
            button.on('drag', (pointer: Vec2, dragX: number, dragY: number) => {
                button.x = dragX;
                button.y = dragY;
            });
            button.on('dragend', (pointer: Vec2) => {
                button.setAlpha(1);
                const gridIndex = this.grid!.getIndexForPosition(pointer);
                if (gridIndex) {
                    this.addItemToGrid(item.type, gridIndex);
                }
                button.setPosition(50 + index * 100, 50);
            });
            toolMenu.add(button);
        });
    }

    private createGridDimensionButtons() {
        const increaseRowsButton = this.add.text(50, 150, 'Increase Rows', {
            fontSize: '20px',
            color: '#fff'
        }).setInteractive();
        const decreaseRowsButton = this.add.text(50, 180, 'Decrease Rows', {
            fontSize: '20px',
            color: '#fff'
        }).setInteractive();
        const increaseColsButton = this.add.text(50, 210, 'Increase Columns', {
            fontSize: '20px',
            color: '#fff'
        }).setInteractive();
        const decreaseColsButton = this.add.text(50, 240, 'Decrease Columns', {
            fontSize: '20px',
            color: '#fff'
        }).setInteractive();
        const increaseSizeButton = this.add.text(50, 270, 'Increase Size', {
            fontSize: '20px',
            color: '#fff'
        }).setInteractive();
        const decreaseSizeButton = this.add.text(50, 300, 'Decrease Size', {
            fontSize: '20px',
            color: '#fff'
        }).setInteractive();

        increaseRowsButton.on('pointerdown', () => this.updateGridDimensions(this.levelData.columns, this.levelData.rows + 1, this.levelData.size!));
        decreaseRowsButton.on('pointerdown', () => this.updateGridDimensions(this.levelData.columns, this.levelData.rows - 1, this.levelData.size!));
        increaseColsButton.on('pointerdown', () => this.updateGridDimensions(this.levelData.columns + 1, this.levelData.rows, this.levelData.size!));
        decreaseColsButton.on('pointerdown', () => this.updateGridDimensions(this.levelData.columns - 1, this.levelData.rows, this.levelData.size!));
        increaseSizeButton.on('pointerdown', () => this.updateGridDimensions(this.levelData.columns, this.levelData.rows, this.getNextGridSize(this.levelData.size!)));
        decreaseSizeButton.on('pointerdown', () => this.updateGridDimensions(this.levelData.columns, this.levelData.rows, this.getPreviousGridSize(this.levelData.size!)));
    }

    private updateGridDimensions(columns: number, rows: number, size: GridSize) {
        this.levelData.columns = columns;
        this.levelData.rows = rows;
        this.levelData.size = size;
        //this.grid?.destroy();
        this.createGrid(columns, rows, size);
    }

    private getNextGridSize(currentSize: GridSize): GridSize {
        const sizes = [GridSizes.S, GridSizes.M, GridSizes.L, GridSizes.XL];
        const currentIndex = sizes.indexOf(currentSize);
        return sizes[(currentIndex + 1) % sizes.length];
    }

    private getPreviousGridSize(currentSize: GridSize): GridSize {
        const sizes = [GridSizes.S, GridSizes.M, GridSizes.L, GridSizes.XL];
        const currentIndex = sizes.indexOf(currentSize);
        return sizes[(currentIndex - 1 + sizes.length) % sizes.length];
    }

    private addItemToGrid(itemType: string, index: { x: number, y: number }) {
        switch (itemType) {
            case 'Power':
                this.grid!.addItemAtIndex(index, new Power(this).setScale(this.grid?.getGridSize().relativeScale));
                break;
            case 'Light':
                this.grid!.addItemAtIndex(index, new Light(this).setScale(this.grid?.getGridSize().relativeScale));
                break;
            case 'Stopper':
                this.grid!.addItemAtIndex(index, new Stopper(this, false).setScale(this.grid?.getGridSize().relativeScale));
                break;
            case 'Or':
                this.grid!.addItemAtIndex(index, new Or(this).setScale(this.grid?.getGridSize().relativeScale));
                break;
            case 'And':
                this.grid!.addItemAtIndex(index, new And(this).setScale(this.grid?.getGridSize().relativeScale));
                break;
            case 'Not':
                this.grid!.addItemAtIndex(index, new Not(this).setScale(this.grid?.getGridSize().relativeScale));
                break;
            case 'Splitter':
                this.grid!.addItemAtIndex(index, new Splitter(this).setScale(this.grid?.getGridSize().relativeScale));
                break;
            case 'SwitchIn':
                this.grid!.addItemAtIndex(index, new SwitchIn(this, false).setScale(this.grid?.getGridSize().relativeScale));
                break;
            case 'SwitchOut':
                this.grid!.addItemAtIndex(index, new SwitchOut(this, false).setScale(this.grid?.getGridSize().relativeScale));
                break;
        }
        this.levelData.items.push({type: itemType, position: index});
    }

    private checkSources() {
        this.grid!.getItems().forEach(item => item.reset());
        this.grid!.getConnections().forEach(connection => connection.setDirectedWithPower(PowerInfo.NO_INFO));

        for (let powerSource of this.grid!.getPowerSources()) {
            this.powerForwarder!.forwardPower(PowerInfo.POWER_ON, powerSource, this.grid!.getConnections());
        }
    }
}