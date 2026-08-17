import { _decorator, Component, Node, Graphics, Label } from 'cc';
import { GameManager } from '../core/GameManager.ts';
import { EventBus, Events } from '../core/EventBus.ts';
import { getSectById, SECTS } from '../data/Sects.ts';
import { NPCS } from '../data/Npcs.ts';
import { getWugongByWeapon, getBasicWugong } from '../data/MartialArts.ts';
import { getWeaponById } from '../data/Weapons.ts';
import { makeInkPanel, makeInkLabel, makeInkButton } from './UiKit.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 宗门界面（V 键，独立面板）
 * 未拜师：七派总览（门派/掌门/武器）与入派引导；
 * 已拜师：门派·称号、掌门、本门武器与武学一览（✓/★装备中）。
 * 布局规范：所有文字块之间留足空隙（≥12px），TOP 对齐用「文本起点 - h/2」定位。
 */
@ccclass('SectPanel')
export class SectPanel extends Component {
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
        const root = new Node('SectPanel');
        this.node.addChild(root);
        this.root = root;

        // 全屏深色遮罩
        const bg = root.addComponent(Graphics);
        bg.fillColor.set(20, 16, 12, 245);
        bg.rect(-1000, -700, 2000, 1400);
        bg.fill();

        makeInkPanel(root, 900, 620, { bg: '#322D26', border: '#C9B896' });

        makeInkLabel(root, '宗 门', { x: 0, y: 270, fontSize: 30, bold: true, color: '#F0E6CE', w: 500, h: 40 });

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

    private refresh(): void {
        if (!this.contentRoot) return;
        const content = this.contentRoot;
        content.removeAllChildren();

        const gm = GameManager.inst;
        const s = gm.state;
        const sect = s.sectId ? getSectById(s.sectId) : undefined;
        // 布局规范：所有块 CENTER 对齐、块间空隙 ≥12px。
        // 面板标题「宗 门」位于 y270（h40 → 250..290），内容标题不得超过 y250。

        if (!sect) {
            // ===== 未拜师：七派总览 =====
            makeInkLabel(content, '尚未拜师', { x: 0, y: 215, fontSize: 24, bold: true, color: '#E8C56A', w: 780, h: 32 });
            makeInkLabel(content, '江湖七派正在主城招募弟子。前往主城，寻一位招募者，随他入山门见掌门，通过考核即可拜师入门。', {
                x: 0, y: 160, fontSize: 15, color: '#B8B09A', w: 780, h: 50,
            });
            // 七派列表（7 行 × 24 = 168 高，CENTER）
            const lines: string[] = [];
            for (const key of Object.keys(SECTS)) {
                const sd = SECTS[key];
                const master = NPCS[sd.masterId];
                const weapon = getWeaponById(sd.weapon);
                lines.push(`  ${sd.name}　掌门：${master?.name ?? '?'}　武器：${weapon.name}`);
            }
            const listLabel = makeInkLabel(content, lines.join('\n'), {
                x: 0, y: -30, fontSize: 16, color: '#D8CEB4', w: 780, h: 168,
            });
            listLabel.lineHeight = 24;
            makeInkLabel(content, '（按 Q 查看任务指引）', { x: 0, y: -235, fontSize: 13, color: '#6E6858', w: 780, h: 20 });
            return;
        }

        // ===== 已拜师 =====
        const master = NPCS[sect.masterId];
        makeInkLabel(content, `${sect.name} · ${s.sectTitle ?? ''}`, {
            x: 0, y: 215, fontSize: 26, bold: true, color: '#E8C56A', w: 780, h: 34,
        });
        const weapon = getWeaponById(sect.weapon);
        makeInkLabel(content, `掌门：${master?.name ?? '?'}　　本门武器：${weapon.name}`, {
            x: 0, y: 160, fontSize: 15, color: '#B8B09A', w: 780, h: 26,
        });
        // 门派武学一览：仅名称 + 状态（避免长描述换行导致溢出）
        const lines: string[] = ['【门派武学】'];
        const basic = getBasicWugong(sect.weapon);
        if (basic) {
            lines.push(`  ${basic.name}（普攻）${s.ownedMartials.includes(basic.id) ? '✓' : '未习得'}`);
        }
        for (const ma of getWugongByWeapon(sect.weapon)) {
            const owned = s.ownedMartials.includes(ma.id);
            const equipped = s.equipped.wugong.includes(ma.id);
            lines.push(`  ${ma.name}${owned ? (equipped ? ' ★装备中' : ' ✓') : '（未习得）'}`);
        }
        const artLabel = makeInkLabel(content, lines.join('\n'), {
            x: 0, y: 80, fontSize: 16, color: '#D8CEB4', w: 780, h: 132,
        });
        artLabel.lineHeight = 22;
        makeInkLabel(content, '（其余门派武学可于问道塔与江湖中寻获）', {
            x: 0, y: -235, fontSize: 13, color: '#6E6858', w: 780, h: 20,
        });
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
