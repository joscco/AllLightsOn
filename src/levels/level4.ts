import {LevelConfig} from "./LevelConfig";

export const LEVEL_4: LevelConfig = {
  "title": "Level 4",
      rows: 3,
      columns: 13,
  "items": [
    {"type": "Power", "position": {"x": -5, "y": -1}},
    {"type": "Power", "position": {"x": -5, "y": 0}},
    {"type": "Stopper", "position": {"x": -2, "y": -1}},
    {"type": "Stopper", "position": {"x": -2, "y": 0}},
    {"type": "Or", "position": {"x": 2, "y": -1}},
    {"type": "Light", "position": {"x": 6, "y": -1}}
  ],
  "connections": []
}