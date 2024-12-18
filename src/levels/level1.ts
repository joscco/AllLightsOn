import {LevelConfig} from "./LevelConfig";
import {GridSizes} from "../gameobjects/GridStuff/GridConsts";

export const LEVEL_1 : LevelConfig = {
  title: "Level 1",
  size: GridSizes.L,
  columns: 5, rows: 3,
  items: [
    {type: "Power", position: {x: -2, y: 0}},
    {type: "Light", position: {x: 2, y: 0}}
  ],
  connections: []
}