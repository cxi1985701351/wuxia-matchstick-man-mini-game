import { _decorator, Component, Node, director, Director, view } from 'cc';
import { GameManager } from './GameManager.ts';
import { WorldManager } from './WorldManager.ts';
import { CombatManager } from '../combat/CombatManager.ts';
import { MainMenu } from '../ui/MainMenu.ts';
import { EventBus, Events } from './EventBus.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 场景入口（挂在场景根节点）
 * 初始化 GameManager；先显示主菜单选择存档位，选档后构建主城世界。
 * URL 带 ?autostart=1 时跳过主菜单直接进入（开发/自动化测试用）。
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
        // MENU_START/MENU_EXIT 始终注册（ESC/触屏退出在 autostart 模式下也可用）
        EventBus.on(Events.MENU_START, this.onMenuStart, this);
        EventBus.on(Events.MENU_EXIT, this.onMenuExit, this);
        // 主菜单选档后再构建世界；?autostart=1 直接进入
        if (typeof location !== 'undefined' && location.search.includes('autostart')) {
            this.buildWorld();
            return;
        }
        this.node.addComponent(MainMenu);
    }

    private onMenuStart(): void {
        this.buildWorld();
    }

    private onMenuExit(): void {
        // 销毁世界管理器（触发 onDestroy 清理事件监听/输入与节点）
        const wm = this.node.getComponent(WorldManager);
        if (wm) wm.destroy();
        // GameManager 保留（MainMenu.pick 会 reloadFromSlot 重载状态）
        // 重建主菜单（autostart 模式下首次创建）
        if (!this.node.getComponent(MainMenu)) {
            this.node.addComponent(MainMenu);
        } else {
            const menu = this.node.getComponent(MainMenu);
            if (menu) menu.show();
        }
    }

    private buildWorld(): void {
        if (this.node.getComponent(WorldManager)) return;
        // 确保 GameManager 存在（选档流程依赖）
        if (!this.node.getComponent(GameManager)) {
            this.node.addComponent(GameManager);
        }
        if (!this.node.getComponent(CombatManager)) {
            this.node.addComponent(CombatManager);
        }
        const wm = this.node.addComponent(WorldManager);
        wm.build(this.node);
    }
}
