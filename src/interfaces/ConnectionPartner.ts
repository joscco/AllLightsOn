import GameObject = Phaser.GameObjects.GameObject;

export interface ConnectionPartner extends GameObject {
    x: number,
    y: number,
    setPosition(x?: number, y?: number): void,

    // Electricity stuff
    reset(): void
    consume(power: boolean): void;
    getMaxNumberOfConnections(): number
    // Can this partner generally forward power?
    isForwarder(): boolean
    isSource(): boolean
    isLightBulb(): boolean
    // Can this partner forward now if power is available
    powerAvailableAfter(power: boolean): boolean;
    // Can this partners forwarding be checked now?
    powerForwardCanBeChecked(numberOfLeftConnections: number): boolean;

    onClick(): void;
}