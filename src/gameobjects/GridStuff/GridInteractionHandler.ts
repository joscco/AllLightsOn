import Phaser from 'phaser';
import {Grid} from './Grid';
import {Connection} from '../Connection';
import {Vec2, vec2Equals} from '../../Helpers/VecMath';
import {AStarFinder} from '../../AStar/AStarFinder';
import {GAME_HEIGHT, GAME_WIDTH} from "../../index";
import Vector2 = Phaser.Math.Vector2;

export class GridInteractionHandler {
    private pathFinder: AStarFinder;
    private pointerPressed: boolean = false;
    private currentConnection?: Connection;
    private lastHoveredIndex?: Vec2;
    private indexPath: Vec2[] = [];
    private onConnectionAdapted: () => void;

    constructor(
        private scene: Phaser.Scene,
        private grid: Grid,
        onConnectionAdapted: () => void
    ) {
        this.pathFinder = new AStarFinder();
        this.onConnectionAdapted = onConnectionAdapted;
        this.defineItemLogic();
        this.createDragContainer();
    }

    private createDragContainer() {
        let dragContainer = this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0, 0);
        dragContainer.setInteractive();
    }

    private defineItemLogic() {
        this.scene.input.on('pointerdown', (pointer: Vector2) => this.onPointerDown(pointer));
        this.scene.input.on('pointermove', (pointer: Vector2) => this.onPointerMove(pointer));
        this.scene.input.on('pointerup', (pointer: Vector2) => this.onPointerUp(pointer));
        this.scene.input.on('pointerupoutside', (pointer: Vector2) => this.onPointerUp(pointer));
    }

    private onPointerDown(pointer: Phaser.Math.Vector2) {
        this.pointerPressed = true;
        let hoveredIndex = this.grid!.getIndexForPosition(pointer);
        let item = this.grid?.getItemAtIndex(hoveredIndex)
            ?? this.grid?.getConnectorAtIndex(hoveredIndex)?.item;
        if (item) {
            this.currentConnection = new Connection(this.scene);
            this.grid?.addUnfinishedConnection(this.currentConnection);
            this.currentConnection.setStart(item);
            this.indexPath = [hoveredIndex];
            this.handleNewPointerIndex(hoveredIndex)
        }
    }

    private onPointerMove(pointer: Phaser.Math.Vector2) {
        if (!this.pointerPressed || !this.currentConnection) {
            return;
        }

        let indexForPointer = this.grid!.getIndexForPosition(pointer);
        if (indexForPointer && this.lastHoveredIndex && vec2Equals(this.lastHoveredIndex, indexForPointer)) {
            return;
        }

        this.handleNewPointerIndex(indexForPointer)
    }

    private handleNewPointerIndex(indexForPointer: Vec2) {
        this.lastHoveredIndex = indexForPointer;

        let existingConnection = this.grid?.getConnectionWithConnectorIndex(indexForPointer);
        if (existingConnection) {
            this.handleExistingConnection(existingConnection, indexForPointer);
        } else {
            this.indexPath = this.addPointToPath(indexForPointer, this.indexPath);
            this.updateConnectionPath();
        }

        if (this.indexPath.length > 0) {
            let startIsSource = this.grid.hasFreeOutputAt(this.indexPath[0]);
            this.currentConnection?.setStartIsSource(startIsSource)
            let posPath = this.grid!.calculatePosPathFromIndices(this.indexPath);
            this.currentConnection!.draw(posPath, this.indexPath);
        }
    }

    private handleExistingConnection(existingConnection: Connection, indexForPointer: Vec2) {
        let hoveredItem = this.grid!.getConnectorAtIndex(indexForPointer)?.item!;

        // We're only interested in connections that have the same start as the current connection (but could be reversed)
        if (existingConnection.isConnectedTo(this.currentConnection!.getStart()!)) {
            let otherItem = [existingConnection.getStart(), existingConnection.getEnd()]
                .find(item => item != hoveredItem)!;
            if (hoveredItem == existingConnection.getStart()) {
                this.indexPath = existingConnection.getIndexPath().reverse();
            } else {
                this.indexPath = existingConnection.getIndexPath();
            }
            this.currentConnection!.setStart(otherItem);
            this.currentConnection!.setEnd(hoveredItem);

            this.grid?.removeConnection(existingConnection);
            this.onConnectionAdapted()
        }
    }

    private updateConnectionPath() {
        let startIndex = this.indexPath.slice().reverse().findIndex(index => {
            let connector = this.grid!.getConnectorAtIndex(index);
            return connector && connector.item == this.currentConnection!.getStart();
        });

        if (startIndex > -1) {
            this.indexPath = this.indexPath.slice(this.indexPath.length - 1 - startIndex);
            this.trimInvalidPath();
            this.setConnectionEnd();
        } else {
            this.indexPath = [];
        }
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
            if (connector && connector.item != this.currentConnection!.getStart()) {
                return true;
            }
        });
        if (firstEndIndex > -1) {
            this.extendPathToEnd(firstEndIndex);
            this.validateConnectionEnd();
        } else {
            this.currentConnection!.resetEnd();
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
            this.currentConnection!.setEnd(itemAtEnd);
        } else if (this.grid?.hasFreeOutputAt(startIndex) && this.grid?.hasFreeInputAt(endIndex)) {
            this.currentConnection!.setEnd(itemAtEnd);
        } else {
            itemAtEnd?.wiggle();
            this.currentConnection!.resetEnd();
        }
    }

    private onPointerUp(pointer: Vector2) {
        this.pointerPressed = false;
        let item = this.grid?.getItemAtIndex(this.grid?.getIndexForPosition(pointer));
        if (item && (!this.currentConnection || item == this.currentConnection?.getStart())) {
            item.onClick();
            this.onConnectionAdapted()
            this.currentConnection?.kill();
            this.currentConnection = undefined;
        } else if (this.currentConnection) {
            this.finalizeConnection();
        }
    }

    private finalizeConnection() {
        if (this.currentConnection!.getStart()
            && this.currentConnection!.getEnd()
            && !this.grid?.hasSimilarConnection(this.currentConnection!)) {
            this.grid!.addConnection(this.currentConnection!);
            this.onConnectionAdapted()
            this.currentConnection = undefined;
        } else {
            this.currentConnection?.getEnd()?.wiggle();
            this.currentConnection?.getStart()?.wiggle();
            this.currentConnection?.kill();
            this.currentConnection = undefined;
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
}