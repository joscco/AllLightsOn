import {LevelConfig} from "./LevelConfig";
import {GridSizes} from "../gameobjects/GridStuff/GridConsts";

export const LEVEL_2: LevelConfig = {
    title: "Level 2",
    size: GridSizes.M,
    rows: 3,
    columns: 12,
    items: [
        {"type": "Power", "position": {"x": -4, "y": 0}},
        {"type": "Stopper", "position": {"x": 0, "y": 0}},
        {"type": "Light", "position": {"x": 5, "y": 0}}
    ],
    connections: []
}