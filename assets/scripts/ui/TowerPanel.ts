import { _decorator, Component, Node, Label, Color, UITransform, input, Input, EventKeyboard, KeyCode } from 'cc';
import { GameManager } from '../core/GameManager.ts';
import { TOWER_FLOORS, TOWER_MAX_FLOOR } from '../data/Tower.ts';
import { EventBus, Events } from '../core/EventBus.ts';
import { MARTIAL_ARTS } from '../data/MartialArts.ts';
import { getWeaponById } from '../data/Weapons.ts';
import { makeInkPanel, makeInkLabel, makeInkButton } from './UiKit.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 问道塔面板
 * 两列 10×2 布局展示 20 层，支持滚轮/方向键滚动。
 */
@ccclass('TowerPanel')
export class TowerPanel extends Component {
    isOpen: boolean = false;
    private root: Node | null = null;
    private contentRoot: Node | null = null;
    private maxLabel: Label | null = null;
    /** 滚动偏移（行） */
    private scrollOffset: number = 0;
    private readonly visibleRows = 10;
    private readonly rowHeight = 56;

    onLoad(): void {
        this.build();
        this.close();
    }

    onDestroy(): void {
        input.off(Input.EventType.MOUSE_WHEEL, this.onWheel, this);
        input.off(Input.EventType.KEY_DOWN, this.onKey, this);
    }

    private onWheel(e: any): void {
        if (!this.isOpen) return;
        const delta = e.getScrollY ? e.getScrollY() : 0;
        if (delta > 0) this.scrollOffset = Math.max(0, this.scrollOffset - 1);
        else this.scrollOffset = Math.min(Math.ceil(TOWER_FLOORS.length / 2) - this.visibleRows, this.scrollOffset + 1);
        this.refreshList();
    }

    private onKey(e: EventKeyboard): void {
        if (!this.isOpen) return;
        if (e.keyCode === KeyCode.ARROW_UP || e.keyCode === KeyCode.KEY_W) {
            this.scrollOffset = Math.max(0, this.scrollOffset - 1);
            this.refreshList();
        } else if (e.keyCode === KeyCode.ARROW_DOWN || e.keyCode === KeyCode.KEY_S) {
            this.scrollOffset = Math.min(Math.ceil(TOWER_FLOORS.length / 2) - this.visibleRows, this.scrollOffset + 1);
            this.refreshList();
        }
    }

    private build(): void {
        const root = new Node('TowerPanel');
        this.node.addChild(root);
        this.root = root;

        // 面板背景
        makeInkPanel(root, 760, 700, { bg: '#322D26', border: '#C9B896' });

        // 标题
        makeInkLabel(root, '问 道 塔', { x: 0, y: 310, fontSize: 32, bold: true, color: '#F0E6CE', w: 400, h: 44 });

        // 最高层
        this.maxLabel = makeInkLabel(root, '已攀至 0 / 20 层', {
            x: 0, y: 262, fontSize: 18, color: '#E8C56A', w: 400, h: 26,
        });

        // 关闭按钮
        makeInkButton(root, '×', {
            x: 340, y: 310, w: 52, h: 52, fontSize: 30,
            bgColor: '#7A3B3B', borderColor: '#C9B896', textColor: '#F5EAD0',
            onClick: () => this.close(),
        });

        // 滚动提示
        makeInkLabel(root, '↑↓ / 滚轮 滚动', { x: 0, y: -310, fontSize: 14, color: '#8A8474', w: 300, h: 22 });

        // 内容区
        this.contentRoot = new Node('content');
        root.addChild(this.contentRoot);
        this.contentRoot.setPosition(0, 60, 0);

        // 事件
        input.on(Input.EventType.MOUSE_WHEEL, this.onWheel, this);
        input.on(Input.EventType.KEY_DOWN, this.onKey, this);

        this.refreshList();
    }

    private refreshList(): void {
        if (!this.contentRoot) return;
        const list = this.contentRoot;
        list.removeAllChildren();

        const gm = GameManager.inst;
        const maxF = gm.state.maxTowerFloor;

        // 两列布局：每行两个层
        for (let row = 0; row < this.visibleRows; row++) {
            const idx0 = (this.scrollOffset + row) * 2;
            const idx1 = idx0 + 1;
            if (idx0 < TOWER_FLOORS.length) this.buildFloorBtn(list, TOWER_FLOORS[idx0], -190, 200 - row * this.rowHeight, maxF);
            if (idx1 < TOWER_FLOORS.length) this.buildFloorBtn(list, TOWER_FLOORS[idx1], 190, 200 - row * this.rowHeight, maxF);
        }
    }

    private buildFloorBtn(parent: Node, floor: (typeof TOWER_FLOORS)[0], x: number, y: number, maxF: number): void {
        const drops: string[] = [];
        if (floor.dropMartial) drops.push(MARTIAL_ARTS[floor.dropMartial].name);
        if (floor.dropWeapon) drops.push(getWeaponById(floor.dropWeapon).name);
        const dropStr = drops.length ? ` ${floor.isBoss ? '★' : ''}${drops.join('、')}` : '';
        const label = `第${floor.floor}层 ${floor.guardName}${floor.isBoss ? ' ★' : ''}`;
        const sub = `${floor.title}${dropStr}`;

        const locked = floor.floor > maxF + 1;
        const cleared = floor.floor <= maxF;

        const btn = makeInkButton(parent, label, {
            x, y, w: 330, h: 46, fontSize: 15,
            bgColor: cleared ? '#4A5A3A' : locked ? '#2E2A22' : '#4A3B2A',
            borderColor: floor.isBoss ? '#E8C56A' : '#8E8A78',
            textColor: locked ? '#6A6454' : '#F0E6CE',
            bold: floor.isBoss,
            onClick: locked ? undefined : () => this.challenge(floor.floor),
        });
        // 副标题小字（子节点）
        makeInkLabel(btn, sub, {
            x: 0, y: -20, fontSize: 11, color: locked ? '#5A5444' : '#B8B09A', w: 320, h: 16,
        });
    }

    open(): void {
        this.isOpen = true;
        if (this.root) this.root.active = true;
        this.scrollOffset = 0;
        const gm = GameManager.inst;
        if (this.maxLabel) {
            this.maxLabel.string = `已攀至 ${gm.state.maxTowerFloor} / ${TOWER_MAX_FLOOR} 层`;
        }
        this.refreshList();
    }

    close(): void {
        this.isOpen = false;
        if (this.root) this.root.active = false;
        EventBus.emit(Events.TOWER_CLOSE);
    }

    private challenge(floor: number): void {
        const gm = GameManager.inst;
        if (floor > gm.state.maxTowerFloor + 1) {
            EventBus.emit(Events.TOAST, '需先通过上一层');
            return;
        }
        this.close();
        // 通过事件总线请求挑战（避免与 WorldManager 循环依赖）
        EventBus.emit(Events.TOWER_CHALLENGE, floor);
    }
}
