import {LevelConfig} from "./LevelConfig";

export const LEVEL_2: LevelConfig = {
    title: "Level 2",
    rows: 3,
    columns: 13,
    items: [
        {"type": "Power", "position": {"x": -5, "y": 0}},
        {"type": "Stopper", "position": {"x": -2, "y": 0}},
        {"type": "Light", "position": {"x": 5, "y": 0}}
    ],
    connections: []
}