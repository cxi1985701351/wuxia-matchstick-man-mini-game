import { _decorator, Component, Node, director, Director, view } from 'cc';
import { GameManager } from './GameManager.ts';
import { WorldManager } from './WorldManager.ts';
import { CombatManager } from '../combat/CombatManager.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 场景入口（挂在场景根节点）
 * 初始化 GameManager，构建主城世界。
 */
@ccclass('GameRoot')
export class GameRoot extends Component {
    onLoad(): void {
        // 设计分辨率（水墨风横屏）
        view.setDesignResolutionSize(1280, 720, 2);
        director.on(Director.EVENT_AFTER_SCENE_LAUNCH, () => {
            this.init();
        });
    }

    start(): void {
        if (director.getScene() && this.node.isValid) {
            this.init();
        }
    }

    private init(): void {
        if (this.node.getComponent(GameManager)) return;
        this.node.addComponent(GameManager);
        this.node.addComponent(CombatManager);
        const wm = this.node.addComponent(WorldManager);
        wm.build(this.node);
    }
}
