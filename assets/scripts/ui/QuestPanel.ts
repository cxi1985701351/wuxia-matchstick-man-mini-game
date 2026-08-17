import { _decorator, Component, Node, Label, Graphics, Color, UITransform } from 'cc';
import { GameManager } from '../core/GameManager.ts';
import { EventBus, Events } from '../core/EventBus.ts';
import { QUESTS } from '../data/Quests.ts';
import { QuestDef } from '../data/GameTypes.ts';
import { makeInkPanel, makeInkLabel, makeInkButton } from './UiKit.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 任务日志面板（Q 键，清单式）
 * 三区：已完成（✓ 摘要）→ 当前任务（▶ 高亮 + 目标逐条打勾）→ 后续任务（◇ 预览）。
 * 数据驱动：Quests.ts 线性链 + PlayerState.flags 达成标记；PLAYER_STATE_CHANGED 自动刷新。
 */
@ccclass('QuestPanel')
export class QuestPanel extends Component {
    isOpen: boolean = false;
    private root: Node | null = null;
    private contentRoot: Node | null = null;

    onLoad(): void {
        this.build();
        this.close();
        EventBus.on(Events.PLAYER_STATE_CHANGED, this.refresh, this);
    }

    onDestroy(): void {
        EventBus.off(Events.PLAYER_STATE_CHANGED, this.refresh, this);
    }

    private build(): void {
        const root = new Node('QuestPanel');
        this.node.addChild(root);
        this.root = root;

        // 全屏深色遮罩
        const bg = root.addComponent(Graphics);
        bg.fillColor.set(20, 16, 12, 245);
        bg.rect(-1000, -700, 2000, 1400);
        bg.fill();

        makeInkPanel(root, 900, 620, { bg: '#322D26', border: '#C9B896' });

        makeInkLabel(root, '任 务 日 志', { x: 0, y: 270, fontSize: 30, bold: true, color: '#F0E6CE', w: 500, h: 40 });

        makeInkButton(root, '×', {
            x: 410, y: 270, w: 50, h: 50, fontSize: 28,
            bgColor: '#7A3B3B', borderColor: '#C9B896', textColor: '#F5EAD0',
            onClick: () => this.close(),
        });

        this.contentRoot = new Node('content');
        root.addChild(this.contentRoot);
        this.contentRoot.setPosition(0, 10, 0);

        this.refresh();
    }

    /** 清单刷新：已完成 / 当前 / 后续 */
    private refresh(): void {
        if (!this.contentRoot) return;
        const content = this.contentRoot;
        content.removeAllChildren();

        const flags = GameManager.inst.state.flags;
        const done: QuestDef[] = [];
        const todo: QuestDef[] = [];
        let current: QuestDef | null = null;
        for (const q of QUESTS) {
            const isDone = q.targets.every((t) => !!flags[t.flag]);
            if (isDone) done.push(q);
            else if (!current) current = q;
            else todo.push(q);
        }

        // 已完成摘要（最多 4 条）
        const doneShown = done.slice(-4);
        if (doneShown.length > 0) {
            makeInkLabel(content, doneShown.map((d) => `✓ ${d.title}`).join('　'), {
                x: 0, y: 205, fontSize: 15, color: '#9A9484', w: 780, h: 24,
            });
        } else {
            makeInkLabel(content, '第一章旅程即将开始……', { x: 0, y: 205, fontSize: 15, color: '#7A7464', w: 780, h: 24 });
        }
        makeInkLabel(content, '─ ─ ─ ─ ─ ─ ─ ─', { x: 0, y: 178, fontSize: 13, color: '#6E6858', w: 780, h: 20 });

        // 当前任务（高亮 + 目标清单）
        if (current) {
            makeInkLabel(content, `▶ ${current.title}`, {
                x: 0, y: 140, fontSize: 24, bold: true, color: '#E8C56A', w: 780, h: 32,
            });
            makeInkLabel(content, current.desc, { x: 0, y: 108, fontSize: 15, color: '#B8B09A', w: 780, h: 24 });
            current.targets.forEach((t, i) => {
                const ok = !!flags[t.flag];
                makeInkLabel(content, `${ok ? '✓' : '○'} ${t.text}`, {
                    x: 0, y: 74 - i * 32, fontSize: 18,
                    color: ok ? '#8E9A6E' : '#F0E6CE', w: 780, h: 26,
                });
            });
        } else {
            makeInkLabel(content, '第一章目标已全部达成！', {
                x: 0, y: 120, fontSize: 24, bold: true, color: '#E8C56A', w: 780, h: 32,
            });
        }

        // 后续任务预览
        if (todo.length > 0) {
            makeInkLabel(content, '后续：' + todo.slice(0, 3).map((t) => t.title).join(' → '), {
                x: 0, y: -210, fontSize: 14, color: '#6E6858', w: 780, h: 24,
            });
        }
    }

    toggle(): void {
        if (this.isOpen) this.close();
        else this.open();
    }

    open(): void {
        this.isOpen = true;
        if (this.root) this.root.active = true;
        this.refresh();
    }

    close(): void {
        this.isOpen = false;
        if (this.root) this.root.active = false;
    }
}
