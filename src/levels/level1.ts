import {LevelConfig} from "./LevelConfig";
import {GridSize} from "../gameobjects/Grid";

export const LEVEL_1 : LevelConfig = {
  title: "Level 1",
  size: GridSize.L,
  columns: 5, rows: 3,
  items: [
    {type: "Power", position: {x: -2, y: 0}},
    {type: "Light", position: {x: 2, y: 0}}
  ],
  connections: []
}