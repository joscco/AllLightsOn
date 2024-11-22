import Phaser from 'phaser';
import {Grid, GridSize, GridSizes} from '../gameobjects/Grid';
import {LEVEL_DATA, LevelConfig} from '../levels/LevelConfig';
import {GridInteractionHandler} from '../gameobjects/GridInteractionHandler';
import {PowerForwarder} from '../gameobjects/PowerForwarder';
import {Light} from '../gameobjects/Items/Light';
import {Power} from '../gameobjects/Items/Power';
import {Stopper} from '../gameobjects/Items/Stopper';
import {Or} from '../gameobjects/Items/Or';
import {And} from '../gameobjects/Items/And';
import {Not} from '../gameobjects/Items/Not';
import {Splitter} from '../gameobjects/Items/Splitter';
import {SwitchIn} from '../gameobjects/Items/SwitchIn';
import {SwitchOut} from '../gameobjects/Items/SwitchOut';
import {GAME_HEIGHT, GAME_WIDTH} from '../index';
import {PowerInfo} from "../gameobjects/Connection";
import {WinScreen} from "../gameobjects/WinScreen";
import {Item} from "../interfaces/Item";

const TEXT_STYLE = {
    fontFamily: "ItemFont",
    fontSize: 60
};

export default class PlayScene extends Phaser.Scene {
    private level?: number;
    private levelData?: LevelConfig;
    private isShowingWinScreen: boolean = false;
    private powerForwarder?: PowerForwarder;
    private grid?: Grid;
    private gridInteractionHandler?: GridInteractionHandler;
    private winScreen?: WinScreen

    constructor(key: string = 'PlayScene') {
        super({key: key});
    }

    init(data: {level: number}) {
        this.level = data.level;
        this.levelData = LEVEL_DATA[this.level - 1];
        this.isShowingWinScreen = false;
    }

    create() {
        this.setupLevel(this.levelData!);
    }

    private async setupLevel(config: LevelConfig) {
        this.createHeading(config.title ?? "Turn on all Lights");
        this.createGrid(config.columns, config.rows, config.size ?? GridSizes.M);
        this.createWinScreen()
        this.gridInteractionHandler = new GridInteractionHandler(
            this,
            this.grid!,
            () => this.checkSources()
        );
        this.powerForwarder = new PowerForwarder(this.grid!);
        config.items.forEach((configItem: any) => {
            const {type, position} = configItem;
            let item: Item
            switch (type) {
                case 'Power':
                    item = new Power(this);
                    break;
                case 'Light':
                    item = new Light(this);
                    break;
                case 'Stopper':
                    item = new Stopper(this, false);
                    break;
                case 'Or':
                    item = new Or(this);
                    break;
                case 'And':
                    item = new And(this);
                    break;
                case 'Not':
                    item = new Not(this);
                    break;
                case 'Splitter':
                    item =  new Splitter(this);
                    break;
                case 'SwitchIn':
                    item = new SwitchIn(this, false);
                    break;
                case 'SwitchOut':
                    item = new SwitchOut(this, false);
                    break;
            }
            item!.setAlpha(0)
            item!.setGridSize(this.grid!.getGridSize());
            this.grid!.addItemAtIndex(position, item!);
        });

        await this.grid!.fadeInGrid();
        this.grid!.fadeInItems();
    }

    private createHeading(heading: string) {
        let text = this.add.text(GAME_WIDTH / 2, 100, heading, TEXT_STYLE);
        text.setOrigin(0.5, 0.5);
    }

    private createGrid(columns: number, rows: number, size: GridSize) {
        this.grid = new Grid(
            this,
            GAME_WIDTH / 2,
            GAME_HEIGHT / 2,
            columns, rows,
            size
        );
    }

    private checkSources() {
        this.grid!.getItems().forEach(item => item.reset());
        this.grid!.getConnections().forEach(connection => connection.setDirectedWithPower(PowerInfo.NO_INFO));

        for (let powerSource of this.grid!.getPowerSources()) {
            this.powerForwarder!.forwardPower(PowerInfo.POWER_ON, powerSource, this.grid!.getConnections());
        }

        this.checkWinCondition();
    }

    private checkWinCondition() {
        if (this.grid!.getItems().filter(item => item.isLightBulb()).every(bulb => (bulb as Light).isOn())) {
            this.showWinScreen();
        }
    }

    private showWinScreen() {
        if (!this.isShowingWinScreen) {
            this.isShowingWinScreen = true;
            this.winScreen!.fadeIn();
        }
    }

    private createWinScreen() {
        this.winScreen = new WinScreen(this, (LEVEL_DATA.length == this.level) ? undefined : this.level! + 1);
    }
}