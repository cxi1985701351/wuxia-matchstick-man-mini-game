import { _decorator, Component, Node, Graphics } from 'cc';
import { SaveSystem, SlotInfo } from '../core/SaveSystem.ts';
import { GameManager } from '../core/GameManager.ts';
import { EventBus, Events } from '../core/EventBus.ts';
import { QUESTS } from '../data/Quests.ts';
import { makeInkPanel, makeInkLabel, makeInkButton } from './UiKit.ts';

const { ccclass } = _decorator;

const SLOT_NAMES = ['存档 一', '存档 二', '存档 三'];

/** 境界称号（与 GameManager.realmName 一致） */
function realmOf(level: number): string {
    if (level <= 5) return '炼气期';
    if (level <= 10) return '筑基期';
    if (level <= 15) return '金丹期';
    if (level <= 20) return '元婴期';
    if (level <= 25) return '化神期';
    return '大乘期';
}

/** 当前进行中的任务标题（第一个目标未全部达成的任务；全达成 → 江湖游历） */
function currentQuestTitle(state: { flags: Record<string, boolean> }): string {
    for (const q of QUESTS) {
        if (!q.targets.every((t) => state.flags[t.flag])) return q.title;
    }
    return '江湖游历';
}

function formatTime(ts: number): string {
    if (!ts) return '未知';
    const d = new Date(ts);
    const p = (n: number): string => String(n).padStart(2, '0');
    return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 估算文本渲染宽度（汉字=fontSize，数字/字母/标点≈0.6，空格≈0.5） */
function textWidth(text: string, fontSize: number): number {
    let w = 0;
    for (const ch of text) {
        if (ch === ' ') w += fontSize * 0.5;
        else if (/[0-9A-Za-z：·:%\-/]/.test(ch)) w += fontSize * 0.6;
        else w += fontSize;
    }
    return w;
}

/**
 * 墨江湖 - 主菜单（进入游戏选择存档）
 * 全屏选档界面：3 个存档位卡片（境界/任务/时间 + 继续/新建 + 两步删除），
 * 选中后发 MENU_START 事件，由 GameRoot 构建世界。
 */
@ccclass('MainMenu')
export class MainMenu extends Component {
    private root: Node | null = null;
    private cardRoot: Node | null = null;
    /** 待确认删除的存档位 */
    private pendingDelete: Record<string, boolean> = {};

    onLoad(): void {
        this.build();
    }

    private build(): void {
        const root = new Node('MainMenu');
        this.node.addChild(root);
        this.root = root;

        // 全屏背景（墨色）
        const bg = root.addComponent(Graphics);
        bg.fillColor.fromHEX('#14110D');
        bg.rect(-640, -360, 1280, 720);
        bg.fill();

        // 标题区（居中，间隙 ≥12px）
        makeInkLabel(root, '墨 江 湖', { x: 0, y: 285, fontSize: 54, bold: true, color: '#F0E6CE', w: 600, h: 70 });
        makeInkLabel(root, '水墨江湖 · 回合制修仙', { x: 0, y: 225, fontSize: 18, color: '#B8B09A', w: 500, h: 24 });

        // 三个存档位卡片（y 115 / -65 / -245，间隔 180）
        this.cardRoot = new Node('cards');
        root.addChild(this.cardRoot);
        this.refreshSlots();

        makeInkLabel(root, '进度自动保存于本机浏览器', { x: 0, y: -350, fontSize: 13, color: '#6A5C44', w: 420, h: 20 });
    }

    private refreshSlots(): void {
        if (!this.cardRoot) return;
        this.cardRoot.removeAllChildren();
        const slots: SlotInfo[] = SaveSystem.listSlots();
        const current = SaveSystem.getCurrentSlotId();

        slots.forEach((slot, i) => {
            const card = makeInkPanel(this.cardRoot!, 560, 164, {
                bg: '#241F18',
                border: slot.id === current ? '#E8C56A' : '#C9B896',
            });
            card.setPosition(0, 115 - i * 180, 0);

            // 左列：档位名 + 信息（CENTER 对齐；文本框按内容定宽，
            // 内容左缘统一固定在卡片内 x=-260，避免 SHRINK 缩放与越界）
            const textLeft = -260;
            const labelBox = (text: string, fontSize: number): { x: number; w: number } => {
                const w = Math.ceil(textWidth(text, fontSize)) + 8;
                return { x: textLeft + w / 2, w };
            };

            const nm = labelBox(SLOT_NAMES[i], 24);
            // h=30 ≥ lineHeight(24+6)，避免 SHRINK 因垂直溢出缩小字号
            makeInkLabel(card, SLOT_NAMES[i], { x: nm.x, y: 58, fontSize: 24, bold: true, color: '#F0E6CE', w: nm.w, h: 30 });

            if (slot.state) {
                const st = slot.state;
                const info = `${realmOf(st.level)} Lv.${st.level}${st.sectTitle ? ' · ' + st.sectTitle : ''}`;
                const ib = labelBox(info, 16);
                makeInkLabel(card, info, { x: ib.x, y: 22, fontSize: 16, color: '#C9B896', w: ib.w, h: 22 });
                const quest = `任务：${currentQuestTitle(st)}`;
                const qb = labelBox(quest, 14);
                makeInkLabel(card, quest, { x: qb.x, y: -14, fontSize: 14, color: '#B8B09A', w: qb.w, h: 22 });
                const time = `存档于 ${formatTime(slot.updatedAt)}`;
                const tb = labelBox(time, 12);
                makeInkLabel(card, time, { x: tb.x, y: -46, fontSize: 12, color: '#7A7464', w: tb.w, h: 18 });

                // 右列：继续 / 删除（两步确认）
                makeInkButton(card, '继续江湖', {
                    x: 195, y: 8, w: 160, h: 52, fontSize: 18,
                    bgColor: '#5A4A2A', borderColor: '#E8C56A', textColor: '#F5EAD0',
                    onClick: () => this.pick(slot.id, false),
                });
                const confirming = !!this.pendingDelete[slot.id];
                makeInkButton(card, confirming ? '确认？' : '删', {
                    x: 250, y: -48, w: 44, h: 34, fontSize: 15,
                    bgColor: confirming ? '#7A3B3B' : '#4A3B2A',
                    borderColor: '#C98A8A', textColor: '#F0D8D8',
                    onClick: () => {
                        if (confirming) {
                            delete this.pendingDelete[slot.id];
                            SaveSystem.deleteSlot(slot.id);
                            this.refreshSlots();
                        } else {
                            this.pendingDelete[slot.id] = true;
                            this.refreshSlots();
                        }
                    },
                });
            } else {
                const eb = labelBox('空存档', 16);
                makeInkLabel(card, '空存档', { x: eb.x, y: 22, fontSize: 16, color: '#6A6454', w: eb.w, h: 22 });
                const hint = '点按右侧按钮，开新江湖';
                const hb = labelBox(hint, 14);
                makeInkLabel(card, hint, { x: hb.x, y: -14, fontSize: 14, color: '#6A6454', w: hb.w, h: 22 });
                makeInkButton(card, '新建游戏', {
                    x: 195, y: 8, w: 160, h: 52, fontSize: 18,
                    bgColor: '#4A3B2A', borderColor: '#C9B896', textColor: '#F5EAD0',
                    onClick: () => this.pick(slot.id, true),
                });
            }
        });
    }

    /** 显示主菜单（从游戏中 ESC 返回时调用） */
    show(): void {
        this.pendingDelete = {};
        this.refreshSlots();
        if (this.root) this.root.active = true;
    }

    /** 选档：空位新建 / 占用继续 → 重载状态 → 通知 GameRoot 构建世界 */
    private pick(slotId: string, create: boolean): void {
        if (create) SaveSystem.createSlot(slotId);
        else SaveSystem.selectSlot(slotId);
        GameManager.inst.reloadFromSlot();
        EventBus.emit(Events.MENU_START);
        if (this.root) this.root.active = false;
    }
}
