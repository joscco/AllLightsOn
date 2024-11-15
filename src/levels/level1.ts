import {LevelConfig} from "./LevelConfig";

export const LEVEL_1 : LevelConfig = {
  columns: 5, rows: 3,
  title: "Level 1",
  items: [
    {type: "Power", position: {x: -2, y: 0}},
    {type: "Light", position: {x: 2, y: 0}}
  ],
  connections: []
}