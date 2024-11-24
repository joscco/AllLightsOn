import {Scene} from "phaser";
import {GridSize} from "./GridConsts";
import {Connection} from "../Connection";
import {Vec2, vec2Equals} from "../../Helpers/VecMath";
import {Vector2PairDict} from "../../Helpers/Dict";
import {DEPTHS} from "../../Helpers/Depths";

export class GridConnections {
    private scene: Scene;
    private connections: Connection[] = [];
    private connectionNodePairs: Vector2PairDict<Connection>
    private connectionLayer: Phaser.GameObjects.Layer;

    constructor(scene: Scene) {
        this.scene = scene;
        this.connections = []
        this.connectionNodePairs = new Vector2PairDict();
        this.connectionLayer = this.scene.add.layer();
        this.connectionLayer.setDepth(DEPTHS.CONNECTIONS)
    }

    addUnfinishedConnection(connection: Connection) {
        this.connectionLayer.add(connection);
    }

    addConnection(connection: Connection) {
        this.connectionLayer.add(connection);
        this.connections.push(connection);
    }

    repositionConnections(getPositionPath: (indexPath: Vec2[]) => Vec2[], gridSize: GridSize) {
        this.connections.forEach(connection => {
            connection.setGridSize(gridSize);
            const newPosPath = getPositionPath(connection.getIndexPath())
            connection.fixate(newPosPath);
        });
    }

    getConnections() {
        return this.connections;
    }

    hasConnection(indexPair: [Vec2, Vec2]) {
        return this.connectionNodePairs.has(indexPair);
    }

    hasSimilarConnection(connection: Connection, startIsSource: boolean) {
        let source = startIsSource ? connection.getStart() : connection.getEnd();
        let consumer = startIsSource ? connection.getEnd() : connection.getStart();
        return this.connections
            .filter(existing => existing.getConsumer()! == consumer && existing.getSource()! == source)
            .length > 0;
    }

    removeConnection(connection: Connection) {
        let connectionIndex = this.connections.indexOf(connection, 0);
        if (connectionIndex > -1) {
            this.connections.splice(connectionIndex, 1);
        }

        let indexPath = connection.getIndexPath();
        for (let i = 0; i < indexPath.length - 2; i++) {
            this.connectionNodePairs.deleteAllWithValue(connection);
        }

        connection.kill(true);
    }

    getConnectionForConnectorIndex(index: Vec2): Connection | undefined {
        return this.connections.find(connection =>
            vec2Equals(connection.getSourceIndex()!, index)
            || vec2Equals(connection.getConsumerIndex()!, index));
    }

    async fadeInConnections() {

    }

    async fadeOutConnections() {
        this.connections.forEach(connection => connection.kill(false));
    }
}