import {Vec2} from "../Helpers/VecMath";
import {LEVEL_1} from "./level1";
import {LEVEL_2} from "./level2";
import {LEVEL_3} from "./level3";
import {LEVEL_4} from "./level4";
import {LEVEL_5} from "./level5";
import {LEVEL_6} from "./level6";
import {GridSize} from "../gameobjects/Grid";

export interface LevelConfig {
    title?: string;
    size?: GridSize;
    rows: number;
    columns: number;
    items: Array<{
        type: string;
        position: Vec2
    }>;
    connections?: Array<{
        from: Vec2
        to: Vec2
    }>;
}

export const LEVEL_DATA: LevelConfig[] = [LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5, LEVEL_6]
