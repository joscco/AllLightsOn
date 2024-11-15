export interface LevelConfig {
    title?: string;
    rows: number;
    columns: number;
    items: Array<{
        type: string;
        position: {
            x: number;
            y: number;
        };
    }>;
    connections?: Array<{
        from: {
            x: number;
            y: number;
        };
        to: {
            x: number;
            y: number;
        };
    }>;
}