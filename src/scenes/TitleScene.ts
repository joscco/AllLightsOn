import Phaser from 'phaser';
import {GAME_HEIGHT, GAME_WIDTH, ITEM_FONT} from "../index";
import {TextButton} from "../gameobjects/TextButton";
import {TweenTimeline} from "../Helpers/TweenTimeline";

export default class TitleScene extends Phaser.Scene {

    private fadeInTimeline?: TweenTimeline
    private fadeOutTimeline?: TweenTimeline

    private title?: Phaser.GameObjects.Text;
    private startButton?: TextButton;
    private optionsButton?: TextButton;

    constructor() {
        super({key: 'TitleScene'});
    }

    create() {
        this.title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT + 100, 'All Lights On', {
            fontFamily: ITEM_FONT,
            fontSize: '100px',
            color: '#fff'
        }).setOrigin(0.5);

        this.startButton = new TextButton(this,
            GAME_WIDTH / 2, GAME_HEIGHT + 200,
            400, 100,
            'Start Game',
            () => {
                this.fadeOutAndStart('LevelSelectScene');
            });

        this.optionsButton = new TextButton(this,
            GAME_WIDTH / 2, GAME_HEIGHT + 300,
            250, 100,
            'Options',
            () => {
                this.fadeOutAndStart('OptionsScene');
            }
        );

        this.fadeIn();
    }

    private fadeIn() {
        this.fadeInTimeline?.destroy()
        this.fadeInTimeline = new TweenTimeline({
            scene: this,
            tweens: [
                {
                    at: 0,
                    targets: this.title,
                    y: 300,
                    duration: 500,
                    ease: 'Power2'

                },
                {
                    at: 200,
                    targets: this.startButton,
                    y: GAME_HEIGHT / 2,
                    duration: 500,
                    ease: 'Power2',

                },
                {
                    at: 400,
                    targets: this.optionsButton,
                    y: 700,
                    duration: 500,
                    ease: 'Power2',
                }
            ]
        })
    }

    private fadeOutAndStart(sceneName: string) {
        this.fadeInTimeline?.destroy()
        this.fadeOutTimeline?.destroy()
        this.fadeOutTimeline = new TweenTimeline({
            scene: this,
            tweens: [
                {
                    at: 0,
                    targets: this.optionsButton,
                    y: GAME_HEIGHT + 300,
                    duration: 300,
                    ease: Phaser.Math.Easing.Quadratic.InOut,

                },
                {
                    at: 100,
                    targets: this.startButton,
                    y: GAME_HEIGHT + 200,
                    duration: 300,
                    ease: Phaser.Math.Easing.Quadratic.InOut,

                },
                {
                    at: 200,
                    targets: this.title,
                    y: GAME_HEIGHT + 100,
                    duration: 300,
                    ease: Phaser.Math.Easing.Quadratic.InOut,
                }
            ],
            onComplete: () => {
                this.scene.start(sceneName)
            }
        })
    }
}