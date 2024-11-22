import TweenBuilderConfig = Phaser.Types.Tweens.TweenBuilderConfig;
import {Scene} from "phaser";
import Tween = Phaser.Tweens.Tween;

export type TweenTimelineConfig = {
    scene: Scene,
    tweens: ({ at?: number } & TweenBuilderConfig)[],
    onComplete?: Phaser.Types.Tweens.TweenOnCompleteCallback
}

export class TweenTimeline {
    tweens: Tween[]

    constructor(config: TweenTimelineConfig) {
        let adaptedConfigs = config.tweens.map(tweenConfig => {
            return {
                ...tweenConfig,
                delay: tweenConfig.at ?? 0,
                duration: tweenConfig.duration ?? 0
            }
        })
            // Sort increasing by delay + duration
            .sort((a, b) => (a.delay + a.duration) - (b.delay + b.duration))

        // Add the global onComplete function to the last tween
        if (config.onComplete) {
            let lastConfigCopy = adaptedConfigs.at(-1)!
            let onComplete = lastConfigCopy.onComplete
            lastConfigCopy.onComplete = (tween: Phaser.Tweens.Tween, targets: any | any[]) => {
                if (onComplete) {
                    onComplete!(tween, targets)
                }
                config.onComplete!(tween, targets)
            }
            adaptedConfigs[adaptedConfigs.length - 1] = lastConfigCopy
        }

        this.tweens = config.scene.tweens.addMultiple(adaptedConfigs)
    }

    destroy() {
        this.tweens.forEach(tween => tween.destroy())
    }

    async asPromise() {
        return new Promise<void>((resolve) => {
            this.tweens.at(-1)?.on('complete', () => {
                resolve()
            })
        })
    }
}