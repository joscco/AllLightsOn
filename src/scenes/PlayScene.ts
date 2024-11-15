import Phaser from 'phaser';
import {Light} from "../gameobjects/Items/Light";
import {Power} from "../gameobjects/Items/Power";
import {Stopper} from "../gameobjects/Items/Stopper";
import {Grid, GridSize} from "../gameobjects/Grid";
import {Connection, PowerInfo} from "../gameobjects/Connection";
import {Vec2, vec2Equals} from "../Helpers/VecMath";
import {Or} from "../gameobjects/Items/Or";
import {AStarFinder} from "../AStar/AStarFinder";
import {And} from "../gameobjects/Items/And";
import {Not} from "../gameobjects/Items/Not";
import {Splitter} from "../gameobjects/Items/Splitter";
import {SwitchIn} from "../gameobjects/Items/SwitchIn";
import {SwitchOut} from "../gameobjects/Items/SwitchOut";
import {GAME_HEIGHT, GAME_WIDTH} from "../index";
import {PowerForwarder} from "../gameobjects/PowerForwarder";
import Vector2 = Phaser.Math.Vector2;
import {LevelConfig} from "../levels/LevelConfig";
import {WinScreen} from "../gameobjects/WinScreen";
import {LEVEL_1} from "../levels/level1";
import {LEVEL_2} from "../levels/level2";

const TEXT_STYLE = {
    fontFamily: "ItemFont",
    fontSize: 60
};

const LEVEL_DATA = [LEVEL_1, LEVEL_2]

export default class PlayScene extends Phaser.Scene {
    private grid?: Grid;
    private pathFinder?: AStarFinder;
    private powerForwarder?: PowerForwarder;
    private pressed: boolean = false;
    private connection?: Connection;
    private indexPath: Vec2[] = [];
    private lastIndexForHover?: Vec2;
    private newConnection: boolean = false;
    private level?: number
    private levelData?: LevelConfig

    constructor() {
        super({key: 'PlayScene'});
    }

    init(data: {level: number}) {
        this.level = data.level
        this.levelData = LEVEL_DATA[this.level - 1]
    }

    create() {
        this.setupLevel(this.levelData!)
    }

    private setupLevel(config: LevelConfig) {
        this.createHeading(config.title ?? "Turn on all Lights");
        this.createGrid(config.columns, config.rows);
        this.createDragContainer();
        this.defineItemLogic();
        this.powerForwarder = new PowerForwarder(this.grid!);
        config.items.forEach((item: any) => {
            const {type, position} = item;
            switch (type) {
                case 'Power':
                    this.grid!.addItemAtIndex(position, new Power(this, this.grid!.getUnitSize()));
                    break;
                case 'Light':
                    this.grid!.addItemAtIndex(position, new Light(this, this.grid!.getUnitSize()));
                    break;
                case 'Stopper':
                    this.grid!.addItemAtIndex(position, new Stopper(this, false, this.grid!.getUnitSize()));
                    break;
                case 'Or':
                    this.grid!.addItemAtIndex(position, new Or(this, this.grid!.getUnitSize()));
                    break;
                case 'And':
                    this.grid!.addItemAtIndex(position, new And(this, this.grid!.getUnitSize()));
                    break;
                case 'Not':
                    this.grid!.addItemAtIndex(position, new Not(this, this.grid!.getUnitSize()));
                    break;
                case 'Splitter':
                    this.grid!.addItemAtIndex(position, new Splitter(this, this.grid!.getUnitSize()));
                    break;
                case 'SwitchIn':
                    this.grid!.addItemAtIndex(position, new SwitchIn(this, false, this.grid!.getUnitSize()));
                    break;
                case 'SwitchOut':
                    this.grid!.addItemAtIndex(position, new SwitchOut(this, false, this.grid!.getUnitSize()));
                    break;
            }
        });
    }

    update(time: number) {
        this.grid!.getConnections().forEach(con => con.update(time));
    }

    private createHeading(heading: string) {
        let text = this.add.text(GAME_WIDTH / 2, 100, heading, TEXT_STYLE);
        text.setOrigin(0.5, 0.5);
    }

    private createGrid(columns: number, rows: number) {
        this.grid = new Grid(
            this,
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2 + 50,
            columns, rows,
            GridSize.L
        );
        this.grid.showGrid();
        this.pathFinder = new AStarFinder();
    }

    private createDragContainer() {
        let dragContainer = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0, 0);
        dragContainer.setInteractive();
    }

    private defineItemLogic() {
        this.input.on('pointerdown', (pointer: Vector2) => this.onPointerDown(pointer));
        this.input.on('pointermove', (pointer: Vector2) => this.onPointerMove(pointer));
        this.input.on('pointerup', (pointer: Vector2) => this.onPointerUp(pointer));
        this.input.on('pointerupoutside', (pointer: Vector2) => this.onPointerUp(pointer));
    }

    private onPointerDown(pointer: Phaser.Math.Vector2) {
        this.pressed = true;
        let index = this.grid!.getIndexForPosition(pointer);
        let item = this.grid!.getItemAtIndex(index) ?? this.grid!.getConnectorAtIndex(index)?.item;
        if (item) {
            this.connection = new Connection(this, this.grid!.getUnitSize());
            this.grid!.addConnectionToLayer(this.connection);
            this.connection.setStart(item);
            this.indexPath = [this.grid!.getIndexForPosition(pointer)];
            this.newConnection = true;
            this.onPointerMove(pointer);
        }
    }

    private onPointerMove(pointer: Phaser.Math.Vector2) {
        if (!this.pressed || !this.connection) {
            return;
        }

        let indexForPointer = this.grid!.getIndexForPosition(pointer);
        if (!this.newConnection && indexForPointer
            && this.lastIndexForHover
            && vec2Equals(this.lastIndexForHover, indexForPointer)) {
            return;
        }

        this.newConnection = false;
        this.lastIndexForHover = indexForPointer;

        let existingConnection = this.grid?.getConnectionForConnectorIndex(indexForPointer);
        if (existingConnection) {
            this.handleExistingConnection(existingConnection, indexForPointer);
            return;
        }

        this.indexPath = this.addPointToPath(indexForPointer, this.indexPath);
        this.updateConnectionPath();
    }

    private handleExistingConnection(existingConnection: Connection, indexForPointer: Vec2) {
        let hoveredItem = this.grid!.getConnectorAtIndex(indexForPointer)?.item!;
        if ([existingConnection.getStart(), existingConnection.getEnd()].some(item => this.connection!.getStart()! == item)) {
            let otherItem = [existingConnection.getStart(), existingConnection.getEnd()]
                .find(item => item != hoveredItem)!;
            if (hoveredItem == existingConnection.getStart()) {
                this.indexPath = existingConnection.getIndexPath().reverse();
            } else {
                this.indexPath = existingConnection.getIndexPath();
            }
            this.connection!.setStart(otherItem);
            this.connection!.setEnd(hoveredItem);
            this.grid!.removeConnection(existingConnection);
            this.checkSources();

            let posPath = this.grid!.calculatePosPathFromIndices(this.indexPath);
            this.connection!.setPath(posPath, this.indexPath);
            this.connection!.draw();
        }
    }

    private updateConnectionPath() {
        let startIndex = this.indexPath.slice().reverse().findIndex(index => {
            let connector = this.grid!.getConnectorAtIndex(index);
            return connector && connector.item == this.connection!.getStart();
        });

        if (startIndex > -1) {
            this.indexPath = this.indexPath.slice(this.indexPath.length - 1 - startIndex);
            this.trimInvalidPath();
            this.setConnectionEnd();
        } else {
            this.indexPath = [];
        }

        let posPath = this.grid!.calculatePosPathFromIndices(this.indexPath);
        this.connection!.setPath(posPath, this.indexPath);
        this.connection!.draw();
    }

    private trimInvalidPath() {
        let firstInvalidIndex = this.indexPath.findIndex(index => {
            return (this.grid!.getItemAtIndex(index) != undefined) || (this.grid?.getConnectorAtIndex(index)?.used);
        });
        if (firstInvalidIndex > -1) {
            this.indexPath = this.indexPath.slice(0, firstInvalidIndex);
        }
    }

    private setConnectionEnd() {
        let firstEndIndex = this.indexPath.findIndex(index => {
            let connector = this.grid!.getConnectorAtIndex(index);
            if (connector && connector.item != this.connection!.getStart()) {
                return true;
            }
        });
        if (firstEndIndex > -1) {
            this.extendPathToEnd(firstEndIndex);
            this.validateConnectionEnd();
        } else {
            this.connection!.resetEnd();
        }
    }

    private extendPathToEnd(firstEndIndex: number) {
        if (this.indexPath.length - 1 != firstEndIndex) {
            let pathToAdd = this.pathFinder!.findPath(this.grid!, this.indexPath[firstEndIndex - 1], this.indexPath.at(-1)!);
            this.indexPath = this.removeDuplicates(pathToAdd, this.indexPath.slice(0, firstEndIndex));
        }
    }

    private validateConnectionEnd() {
        let startIndex = this.indexPath[0];
        let endIndex = this.indexPath.at(-1)!;
        let itemAtEnd = this.grid!.getConnectorAtIndex(endIndex)?.item;

        if (this.grid?.hasFreeInputAt(startIndex) && this.grid?.hasFreeOutputAt(endIndex)) {
            this.connection!.setEnd(itemAtEnd);
        } else if (this.grid?.hasFreeOutputAt(startIndex) && this.grid?.hasFreeInputAt(endIndex)) {
            this.connection!.setEnd(itemAtEnd);
        } else {
            itemAtEnd?.wiggle();
            this.connection!.resetEnd();
        }
    }

    private onPointerUp(pointer: Vector2) {
        this.pressed = false;
        let item = this.grid?.getItemAtIndex(this.grid?.getIndexForPosition(pointer));
        if (item && (!this.connection || item == this.connection?.getStart())) {
            item.onClick();
            this.checkSources();
            this.connection?.kill();
            this.connection = undefined;
        } else if (this.connection) {
            this.finalizeConnection();
        }
    }

    private finalizeConnection() {
        if (this.connection!.getStart() && this.connection!.getEnd() && !this.grid!.hasConnection(this.connection!)) {
            this.grid!.addConnection(this.connection!);
            this.checkSources();
            this.connection = undefined;
        } else {
            this.connection?.getEnd()?.wiggle();
            this.connection?.getStart()?.wiggle();
            this.connection?.kill();
            this.connection = undefined;
        }
    }

    private addPointToPath(indexForPointer: Vec2, switcherPath: Vec2[]): Vec2[] {
        let lastIndex = switcherPath.at(-1);
        let newIndices: Vec2[] = [];
        if (!lastIndex
            || (this.grid?.isFreeAt(indexForPointer, lastIndex)
                && Math.abs(indexForPointer.x - lastIndex.x) + Math.abs(indexForPointer.y - lastIndex.y) == 1)
        ) {
            newIndices.push(indexForPointer);
        } else {
            newIndices = this.pathFinder!.findPath(this.grid!, lastIndex, indexForPointer);
        }

        switcherPath = this.removeDuplicates(newIndices, switcherPath);
        return switcherPath;
    }

    private removeDuplicates(newIndices: Vec2[], switcherPath: Vec2[]): Vec2[] {
        for (let newIndex of newIndices) {
            let previousOccurrenceInPath = switcherPath.findIndex(index => vec2Equals(index, newIndex));
            if (previousOccurrenceInPath > -1) {
                if (previousOccurrenceInPath != switcherPath.length - 1) {
                    switcherPath = switcherPath.slice(0, Math.max(previousOccurrenceInPath + 1, 1));
                }
            } else {
                switcherPath.push(newIndex);
            }
        }
        return switcherPath;
    }

    private checkSources() {
        this.grid!.getItems().forEach(item => item.reset());
        this.grid!.getConnections().forEach(connection => connection.setDirectedWithPower(PowerInfo.NO_INFO));

        for (let powerSource of this.grid!.getPowerSources()) {
            this.powerForwarder!.forwardPower(PowerInfo.POWER_ON, powerSource, this.grid!.getConnections());
        }

        if (this.grid!.getItems().filter(item => item.isLightBulb()).every(bulb => (bulb as Light).isOn())) {
            this.showWinScreen();
        }
    }

    private showWinScreen() {
        new WinScreen(this, (LEVEL_DATA.length == this.level) ? undefined : this.level! + 1)
    }
}