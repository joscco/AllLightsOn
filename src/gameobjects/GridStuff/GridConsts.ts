export type GridSize = {
    unitSize: number,
    relativeScale: number
};

export const GridSizes: { [key: string]: GridSize } = {
    XS: {unitSize: 80, relativeScale: 0.4},
    S: {unitSize: 100, relativeScale: 0.5},
    M: {unitSize: 120, relativeScale: 0.6},
    L: {unitSize: 160, relativeScale: 0.8},
    XL: {unitSize: 200, relativeScale: 1}
};
