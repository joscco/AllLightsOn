import {LevelConfig} from "./LevelConfig";

export const LEVEL_5: LevelConfig = {
  "title": "Level 5",
      rows: 4,
      columns: 13,
  "items": [
    {"type": "Power", "position": {"x": -5, "y": -1}},
    {"type": "Power", "position": {"x": -5, "y": 0}},
    {"type": "Stopper", "position": {"x": -2, "y": -1}},
    {"type": "Stopper", "position": {"x": -2, "y": 0}},
    {"type": "And", "position": {"x": 2, "y": -1}},
    {"type": "Light", "position": {"x": 6, "y": -1}}
  ],
  "connections": []
}