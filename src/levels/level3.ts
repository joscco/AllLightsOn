import {LevelConfig} from "./LevelConfig";
import {GridSizes} from "../gameobjects/GridStuff/GridConsts";

export const LEVEL_3: LevelConfig = {
    "title": "Level 3",
    size: GridSizes.S,
    rows: 3,
    columns: 13,
    "items": [
        {"type": "Power", "position": {"x": -5, "y": 0}},
        {"type": "Stopper", "position": {"x": -2, "y": 0}},
        {"type": "Not", "position": {"x": 2, "y": 0}},
        {"type": "Light", "position": {"x": 6, "y": 0}}
    ],
    "connections": []
}