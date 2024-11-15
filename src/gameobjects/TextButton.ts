import Container = Phaser.GameObjects.Container;
import NinePatch from "phaser3-rex-plugins/plugins/gameobjects/blitter/ninepatch/NinePatch";
import {GameColors, GameColorStrings} from "../interfaces/Item";
import {ITEM_FONT} from "../index";

export class TextButton extends Container {
    private text: Phaser.GameObjects.Text;
    private background: NinePatch
    private callback: () => void;

    constructor(scene: Phaser.Scene, x: number, y: number, width: number, height:number, text: string, callback: () => void) {
        super(scene, x, y);
        this.callback = callback;

        this.background = scene.rexUI.add.ninePatch2(0, 0, width, height, 'base_white', {
            columns: [40, undefined, 40],
            rows: [40, undefined, 40]
        });
        this.text = scene.add.text(0, -15, text, {fontFamily: ITEM_FONT, fontSize: '50px', color: GameColorStrings.DARK});
        this.text.setOrigin(0.5);

        this.add([this.background, this.text]);
        this.scene.add.existing(this)

        this.background.setInteractive();
        this.background.on('pointerdown', () => {
            this.callback();
        });
    }
}