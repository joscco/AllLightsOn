import PlayScene from './PlayScene';
import {Vec2} from "../Helpers/VecMath";
import {GAME_HEIGHT} from "../index";
import {Scene} from "phaser";

export class LevelEditorScene extends Scene {
    constructor() {
        super('LevelEditorScene');
    }

    create() {
        super.create();
        this.createToolbar();
        this.setupDragAndDrop();
        this.setupConnectionDrawing();
        this.setupLocking();
        this.setupExportShortcut();
    }

    createToolbar() {
        // Create a toolbar at the bottom with draggable items
        this.add.image(100, GAME_HEIGHT - 200, 'itemTexture').setInteractive({ draggable: true });
    }

    setupDragAndDrop() {
        this.input.on('dragstart', (pointer: Vec2, gameObject) => {
            gameObject.setTint(0xff0000);
        });

        this.input.on('drag', (pointer: Vec2, gameObject, dragX, dragY) => {
            gameObject.x = dragX;
            gameObject.y = dragY;
        });

        this.input.on('dragend', (pointer: Vec2, gameObject) => {
            gameObject.clearTint();
            // Add logic to place the item in the grid
        });
    }

    setupConnectionDrawing() {
        // Implement logic to draw connections between grid points
    }

    setupLocking() {
        // Implement logic to lock certain connections or areas
    }

    setupExportShortcut() {
        this.input.on('keydown-P', () => {
            const levelConfig = this.exportLevelConfig();
            console.log(JSON.stringify(levelConfig));
        });
    }

    exportLevelConfig() {
        // Implement logic to export the current level configuration
        return {
            // Example structure
            items: this.grid!.getItems().map(item => item.serialize()),
            connections: this.grid!.getConnections().map(connection => connection.serialize()),
            lockedAreas: this.getLockedAreas()
        };
    }

    getLockedAreas() {
        // Implement logic to get locked areas
        return [];
    }
}