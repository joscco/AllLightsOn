import Phaser from 'phaser';
import {Grid} from '../gameobjects/GridStuff/Grid';
import {LevelConfig} from '../levels/LevelConfig';
import {GridInteractionHandler} from '../gameobjects/GridStuff/GridInteractionHandler';
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
import {GridSize, GridSizes} from "../gameobjects/GridStuff/GridConsts";
import {Item} from "../interfaces/Item";

const TEXT_STYLE = {
    fontFamily: "ItemFont",
    fontSize: 60
};

export class LevelEditorScene extends Phaser.Scene {
    private gridSizes = [GridSizes.XS, GridSizes.S, GridSizes.M, GridSizes.L, GridSizes.XL];
    private grid?: Grid;
    private gridInteractionHandler?: GridInteractionHandler;
    private powerForwarder?: PowerForwarder;
    private levelData: LevelConfig = {
        title: "New Level",
        size: GridSizes.M,
        rows: 6,
        columns: 6,
        items: [],
        connections: []
    };

    private increaseRowsButton?: Phaser.GameObjects.Image;
    private decreaseRowsButton?: Phaser.GameObjects.Image;
    private increaseColsButton?: Phaser.GameObjects.Image;
    private decreaseColsButton?: Phaser.GameObjects.Image;
    private increaseSizeButton?: Phaser.GameObjects.Image;
    private decreaseSizeButton?: Phaser.GameObjects.Image;

    constructor(key: string = 'LevelEditorScene') {
        super({key: key});
    }

    preload() {
        this.load.image('increaseRows', 'assets/images/editor/addRow.png');
        this.load.image('decreaseRows', 'assets/images/editor/removeRow.png');
        this.load.image('increaseCols', 'assets/images/editor/addColumn.png');
        this.load.image('decreaseCols', 'assets/images/editor/removeColumn.png');
        this.load.image('increaseSize', 'assets/images/editor/zoomIn.png');
        this.load.image('decreaseSize', 'assets/images/editor/zoomOut.png');
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
        text.setOrigin(0.5);
        text.setAlign('center');
    }

    private createGrid(columns: number, rows: number, size: GridSize) {
        this.grid = new Grid(
            this,
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            columns, rows,
            size
        );
        this.gridInteractionHandler = new GridInteractionHandler(
            this,
            this.grid,
            () => this.checkSources()
        );
        this.grid.fadeInGrid();
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
        this.increaseRowsButton = this.add.image(100, 150, 'increaseRows').setInteractive();
        this.decreaseRowsButton = this.add.image(200, 150, 'decreaseRows').setInteractive();
        this.increaseColsButton = this.add.image(100, 300, 'increaseCols').setInteractive();
        this.decreaseColsButton = this.add.image(200, 300, 'decreaseCols').setInteractive();
        this.increaseSizeButton = this.add.image(100, 450, 'increaseSize').setInteractive();
        this.decreaseSizeButton = this.add.image(200, 450, 'decreaseSize').setInteractive();

        this.increaseRowsButton.on('pointerdown', () => this.updateGridDimensions(this.levelData.columns, this.levelData.rows + 1, this.levelData.size!));
        this.decreaseRowsButton.on('pointerdown', () => this.updateGridDimensions(this.levelData.columns, this.levelData.rows - 1, this.levelData.size!));
        this.increaseColsButton.on('pointerdown', () => this.updateGridDimensions(this.levelData.columns + 1, this.levelData.rows, this.levelData.size!));
        this.decreaseColsButton.on('pointerdown', () => this.updateGridDimensions(this.levelData.columns - 1, this.levelData.rows, this.levelData.size!));
        this.increaseSizeButton.on('pointerdown', () => this.updateGridDimensions(this.levelData.columns, this.levelData.rows, this.getNextGridSize(this.levelData.size!)));
        this.decreaseSizeButton.on('pointerdown', () => this.updateGridDimensions(this.levelData.columns, this.levelData.rows, this.getPreviousGridSize(this.levelData.size!)));

        this.updateButtonStates();
    }

    private updateGridDimensions(columns: number, rows: number, size: GridSize) {
        this.levelData.columns = columns;
        this.levelData.rows = rows;
        this.levelData.size = size;
        this.grid!.updateGridDimensions(columns, rows, size);
        this.checkSources()
        this.updateButtonStates();
    }

    private updateButtonStates() {
        let currentSizeIndex = this.gridSizes.indexOf(this.levelData.size!);
        this.increaseRowsButton!.setAlpha(this.levelData.rows < 14 ? 1 : 0.5);
        if (this.levelData.rows < 14) {
            this.increaseRowsButton!.setInteractive();
        } else {
            this.increaseRowsButton!.disableInteractive();
        }

        this.decreaseRowsButton!.setAlpha(this.levelData.rows > 1 ? 1 : 0.5);
        if (this.levelData.rows > 1) {
            this.decreaseRowsButton!.setInteractive();
        } else {
            this.decreaseRowsButton!.disableInteractive();
        }

        this.increaseColsButton!.setAlpha(this.levelData.columns < 20 ? 1 : 0.5);
        if (this.levelData.columns < 20) {
            this.increaseColsButton!.setInteractive();
        } else {
            this.increaseColsButton!.disableInteractive();
        }

        this.decreaseColsButton!.setAlpha(this.levelData.columns > 1 ? 1 : 0.5);
        if (this.levelData.columns > 1) {
            this.decreaseColsButton!.setInteractive();
        } else {
            this.decreaseColsButton!.disableInteractive();
        }

        this.increaseSizeButton!.setAlpha(currentSizeIndex < this.gridSizes.length - 1 ? 1 : 0.5);
        if (currentSizeIndex < this.gridSizes.length - 1) {
            this.increaseSizeButton!.setInteractive();
        } else {
            this.increaseSizeButton!.disableInteractive();
        }

        this.decreaseSizeButton!.setAlpha(currentSizeIndex > 0 ? 1 : 0.5);
        if (currentSizeIndex > 0) {
            this.decreaseSizeButton!.setInteractive();
        } else {
            this.decreaseSizeButton!.disableInteractive();
        }
    }

    private getNextGridSize(currentSize: GridSize): GridSize {
        const currentIndex = this.gridSizes.indexOf(currentSize);
        return this.gridSizes[currentIndex + 1];
    }

    private getPreviousGridSize(currentSize: GridSize): GridSize {
        const currentIndex = this.gridSizes.indexOf(currentSize);
        return this.gridSizes[currentIndex - 1];
    }

    private addItemToGrid(itemType: string, index: { x: number, y: number }) {
        let item: Item
        switch (itemType) {
            case 'Power':
                item = new Power(this)
                break;
            case 'Light':
                item = new Light(this)
                break;
            case 'Stopper':
                item = new Stopper(this, false)
                break;
            case 'Or':
                item =  new Or(this)
                break;
            case 'And':
                item = new And(this)
                break;
            case 'Not':
                item = new Not(this)
                break;
            case 'Splitter':
                item =  new Splitter(this)
                break;
            case 'SwitchIn':
                item = new SwitchIn(this, false);
                break;
            case 'SwitchOut':
                item = new SwitchOut(this, false)
                break;
        }
        item!.setScale(this.grid!.getGridSize().relativeScale);
        this.grid!.addItemAtIndex(index, item!)
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