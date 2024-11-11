import {Connection, PowerInfo} from "./Connection";
import {Item} from "../interfaces/Item";
import {Grid} from "./Grid";

export class PowerForwarder {
    private grid: Grid;

    constructor(grid: Grid) {
        this.grid = grid;
    }

    forwardPower(powerInfo: PowerInfo, source: Item, connections: Connection[]) {
        let undirectedConnections = this.getUndirectedConnections(connections);
        for (let connection of undirectedConnections) {
            if (this.canForwardPower(source, powerInfo, connection)) {
                this.forwardToConsumer(connection, powerInfo, undirectedConnections);
            }
        }
    }

    private getUndirectedConnections(connections: Connection[]): Connection[] {
        if (!connections) {
            throw new Error("Connections array is undefined or null");
        }
        return connections.filter(connection => connection.getPowerInfo() == PowerInfo.NO_INFO);
    }

    private canForwardPower(source: Item, powerInfo: PowerInfo, connection: Connection): boolean {
        return connection.getSource() == source && source.allowsForwarding(powerInfo, connection);
    }

    private forwardToConsumer(connection: Connection, powerInfo: PowerInfo, undirectedConnections: Connection[]) {
        let consumer = connection.getConsumer()!;
        connection.setDirectedWithPower(powerInfo);
        let incomingConnections = this.getIncomingConnections(consumer);
        consumer.consume(incomingConnections);

        if (this.shouldForwardPower(consumer, incomingConnections)) {
            let nextPowerInfo = this.getNextPowerInfo(consumer, incomingConnections);
            this.forwardPower(nextPowerInfo, consumer, undirectedConnections);
        }
    }

    private getIncomingConnections(consumer: Item): Connection[] {
        return this.grid.getConnectionsFor(consumer).filter(connection => connection.getConsumer() == consumer);
    }

    private shouldForwardPower(consumer: Item, incomingConnections: Connection[]): boolean {
        return consumer.isPowerForwarder() && consumer.powerForwardCanBeChecked(incomingConnections);
    }

    private getNextPowerInfo(consumer: Item, incomingConnections: Connection[]): PowerInfo {
        return consumer.powerAvailableAfter(incomingConnections) ? PowerInfo.POWER_ON : PowerInfo.POWER_OFF;
    }
}