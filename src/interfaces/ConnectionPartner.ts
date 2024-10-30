import GameObject = Phaser.GameObjects.GameObject;

export interface ConnectionPartner extends GameObject {
    x: number,
    y: number,
    setPosition(x?: number, y?: number): void,

    // Electricity stuff
    consume(power: boolean): void;
    getMaxNumberOfConnections(): number
    // Can this partner generally forward power?
    isForwarder(): boolean
    isSource(): boolean
    isLightBulb(): boolean
    // Can this partner forward now if power is available
    powerCanBeForwarded(power: boolean): boolean;
    // Can this partners forwarding be checked now?
    powerForwardCanBeChecked(): boolean;

    onClick(): void;
}