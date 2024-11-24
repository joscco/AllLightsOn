import Phaser from 'phaser';
import {GAME_HEIGHT, GAME_WIDTH} from "../index";
import {LEVEL_DATA} from "../levels/LevelConfig";
import {TextButton} from "../gameobjects/TextButton";
import {TweenTimeline} from "../Helpers/TweenTimeline";
import Text = Phaser.GameObjects.Text;

export default class LevelSelectScene extends Phaser.Scene {
    private fadeOutTimeline?: TweenTimeline;
    private fadeInTimeline?: TweenTimeline;
    private title?: Text;
    private buttons?: TextButton[];

    constructor() {
        super({key: 'LevelSelectScene'});
    }

    create() {
        this.title = this.add.text(GAME_WIDTH / 2, -100, 'Select Level', {
            fontFamily: 'ItemFont',
            fontSize: '64px',
            color: '#fff'
        }).setOrigin(0.5);

        this.buttons = [];
        for (let i = 0; i < LEVEL_DATA.length; i++) {
            this.buttons.push(this.createLevelButton(i + 1, GAME_HEIGHT));
        }

        this.fadeIn();
    }

    createLevelButton(level: number, y: number) {
        const button = new TextButton(this,
            GAME_WIDTH / 2, y, 250, 100, `Level ${level}`,
            () => {
                this.fadeOutAndStart('PlayScene', {level});
            });
        button.setAlpha(0)
        return button;
    }

    private fadeIn() {
        this.fadeInTimeline?.destroy()
        this.fadeInTimeline = new TweenTimeline({
            scene: this,
            tweens: [
                {
                    at: 0,
                    targets: this.title,
                    y: 100,
                    duration: 500,
                    ease: 'Power2'
                },
                ...this.buttons!.map((button, index) => {
                    return {
                        at: 200 + index * 100,
                        targets: button,
                        y: 250 + index * 130,
                        alpha: 1,
                        duration: 500,
                        ease: 'Power2'
                    };
                })
            ]
        });
    }

    private fadeOutAndStart(sceneName: string, levelData: { level: number }) {
        this.fadeInTimeline?.destroy()
        this.fadeOutTimeline?.destroy()
        this.fadeOutTimeline = new TweenTimeline({
            scene: this,
            tweens: [
                ...this.buttons!.slice()
                    .reverse()
                    .map((button, index) => {
                        return {
                            at: index * 100,
                            targets: button,
                            y: GAME_HEIGHT + index * 100,
                            alpha: 0,
                            duration: 500,
                            ease: Phaser.Math.Easing.Quadratic.InOut
                        };
                    }),
                {
                    at: 0,
                    targets: this.title,
                    y: -100,
                    duration: 500,
                    ease: Phaser.Math.Easing.Quadratic.InOut
                }
            ],
            onComplete: () => {
                this.scene.start(sceneName, levelData)
            }
        })
    }
}