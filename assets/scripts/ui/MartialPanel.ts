import { _decorator, Component, Node, Label, Color, UITransform } from 'cc';
import { GameManager } from '../core/GameManager.ts';
import { MARTIAL_ARTS } from '../data/MartialArts.ts';
import { WEAPONS } from '../data/Weapons.ts';
import { MartialType } from '../data/GameTypes.ts';
import { EventBus, Events } from '../core/EventBus.ts';
import { WEAPON_NAMES } from '../combat/DamageFormula.ts';
import { makeInkPanel, makeInkLabel, makeInkButton } from './UiKit.ts';
import { formatMartialStats } from './MartialFormat.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 武学/武器装备面板（B 键）
 * 布局（三栏式，无重叠）：
 *  左：属性总览
 *  中：标签页 + 武学列表（含数值效果）
 *  右：武器栏（纵向）
 */
@ccclass('MartialPanel')
export class MartialPanel extends Component {
    isOpen: boolean = false;
    private root: Node | null = null;
    private statLabel: Label | null = null;
    private listRoot: Node | null = null;
    private currentTab: 'neigong' | 'qinggong' | 'wugong' | 'bag' = 'wugong';
    private weaponRoot: Node | null = null;

    onLoad(): void {
        this.build();
        this.close();
        EventBus.on(Events.PLAYER_STATE_CHANGED, this.refresh, this);
    }

    onDestroy(): void {
        EventBus.off(Events.PLAYER_STATE_CHANGED, this.refresh, this);
    }

    private build(): void {
        const root = new Node('MartialPanel');
        this.node.addChild(root);
        this.root = root;

        // 面板背景
        makeInkPanel(root, 1000, 660, { bg: '#322D26', border: '#C9B896' });

        // 标题
        makeInkLabel(root, '武 学 与 武 器', { x: 0, y: 292, fontSize: 30, bold: true, color: '#F0E6CE', w: 600, h: 40 });

        // 关闭按钮
        makeInkButton(root, '×', {
            x: 460, y: 292, w: 52, h: 52, fontSize: 30,
            bgColor: '#7A3B3B', borderColor: '#C9B896', textColor: '#F5EAD0',
            onClick: () => this.close(),
        });

        // ===== 左列：属性总览（x=-350）=====
        const stat = new Node('stats');
        root.addChild(stat);
        stat.setPosition(-350, 60, 0);
        const sl = stat.addComponent(Label);
        sl.fontSize = 16;
        sl.lineHeight = 28;
        sl.color = new Color(230, 222, 200, 255);
        sl.horizontalAlign = Label.HorizontalAlign.LEFT;
        sl.verticalAlign = Label.VerticalAlign.TOP;
        sl.overflow = Label.Overflow.NONE;
        stat.addComponent(UITransform).setContentSize(280, 440);
        this.statLabel = sl;

        // ===== 中列：标签页 + 列表（x=30）=====
        const tabs = new Node('tabs');
        root.addChild(tabs);
        tabs.setPosition(30, 228, 0);
        const tabDefs = [
            { label: '武 功', key: 'wugong' as const },
            { label: '内 功', key: 'neigong' as const },
            { label: '轻 功', key: 'qinggong' as const },
            { label: '行 囊', key: 'bag' as const },
        ];
        tabDefs.forEach((tab, i) => {
            makeInkButton(tabs, tab.label, {
                x: i * 110 - 165, y: 0, w: 100, h: 44, fontSize: 18,
                bgColor: '#4A3B2A', borderColor: '#C9B896', textColor: '#F0E6CE',
                onClick: () => this.switchTab(tab.key),
            });
        });

        this.listRoot = new Node('list');
        root.addChild(this.listRoot);
        this.listRoot.setPosition(30, -20, 0);

        // ===== 右列：武器栏（x=380，纵向）=====
        const weaponCol = new Node('weapons');
        root.addChild(weaponCol);
        weaponCol.setPosition(380, 60, 0);
        makeInkLabel(weaponCol, '武  器', { x: 0, y: 200, fontSize: 20, bold: true, color: '#F0E6CE', w: 200, h: 28 });
        this.weaponRoot = weaponCol;
        this.refreshWeapons();
    }

    private refreshWeapons(): void {
        if (!this.weaponRoot) return;
        const root = this.weaponRoot;
        for (const child of [...root.children]) {
            if (child.name === 'btn') child.destroy();
        }
        const gm = GameManager.inst;
        const owned = gm.state.ownedWeapons;
        owned.forEach((wid, i) => {
            const w = WEAPONS[wid];
            const isCurrent = gm.state.weaponId === wid;
            makeInkButton(root, `${w.name}·${WEAPON_NAMES[w.type]}`, {
                x: 0, y: 150 - i * 66, w: 200, h: 52, fontSize: 17,
                bgColor: isCurrent ? '#7A5A2A' : '#4A3B2A',
                borderColor: isCurrent ? '#E8C56A' : '#C9B896',
                textColor: '#F5EAD0',
                onClick: () => {
                    GameManager.inst.equipWeapon(wid);
                    this.refresh();
                },
            });
        });
    }

    private switchTab(tab: 'neigong' | 'qinggong' | 'wugong' | 'bag'): void {
        this.currentTab = tab;
        this.refresh();
    }

    private refresh(): void {
        this.refreshStats();
        this.refreshWeapons();
        this.refreshList();
    }

    private refreshStats(): void {
        const gm = GameManager.inst;
        const st = gm.stats!;
        const s = gm.state;
        const w = WEAPONS[s.weaponId];
        this.statLabel!.string =
            `境界：${gm.realmName} Lv.${s.level}\n` +
            `气血：${st.maxHp}\n` +
            `内力：${st.maxMp}\n` +
            `攻击：${st.atk}\n` +
            `防御：${st.def}\n` +
            `移速：${st.spd}\n` +
            `闪避：${(st.dodge * 100).toFixed(0)}%\n` +
            `暴击：${(st.crit * 100).toFixed(0)}%\n` +
            `内力回复：${st.mpRegen.toFixed(1)}/s\n\n` +
            `─ 已装配 ─\n` +
            `内功：${s.equipped.neigong ? MARTIAL_ARTS[s.equipped.neigong].name : '无'}\n` +
            `轻功：${s.equipped.qinggong ? MARTIAL_ARTS[s.equipped.qinggong].name : '无'}\n` +
            `武功：\n${s.equipped.wugong.map((x) => (x ? ' ·' + MARTIAL_ARTS[x].name : ' ·空')).join('\n')}`;
    }

    private refreshList(): void {
        if (!this.listRoot) return;
        const list = this.listRoot;
        list.removeAllChildren();

        const gm = GameManager.inst;
        const s = gm.state;

        // 行囊标签页：残篇 + 物品
        if (this.currentTab === 'bag') {
            this.refreshBagList(list, gm);
            return;
        }

        const titleText = this.currentTab === 'wugong' ? '武 功（需与武器匹配）' : this.currentTab === 'neigong' ? '内 功' : '轻 功';
        makeInkLabel(list, titleText, { x: 0, y: 200, fontSize: 18, bold: true, color: '#F0E6CE', w: 440, h: 26 });

        let items: { id: string; name: string; owned: boolean; equipped: boolean; type: MartialType }[] = [];
        for (const key of Object.keys(MARTIAL_ARTS)) {
            const ma = MARTIAL_ARTS[key];
            if (ma.type !== this.currentTab) continue;
            // 武功页：基础武学作为普攻不显示、不占槽
            if (this.currentTab === 'wugong' && ma.isBasic) continue;
            if (this.currentTab === 'wugong' && ma.weapon !== WEAPONS[s.weaponId].type) continue;
            const equipped =
                (this.currentTab === 'neigong' && s.equipped.neigong === key) ||
                (this.currentTab === 'qinggong' && s.equipped.qinggong === key) ||
                (this.currentTab === 'wugong' && s.equipped.wugong.includes(key));
            items.push({ id: key, name: ma.name, owned: s.ownedMartials.includes(key), equipped, type: ma.type });
        }
        items = items.sort((a, b) => Number(b.owned) - Number(a.owned) || Number(b.equipped) - Number(a.equipped));

        // 每个条目占 72px，含名称按钮 + 数值说明行，最多显示 6 条
        items.slice(0, 6).forEach((item, i) => {
            const y = 160 - i * 72;
            const ma = MARTIAL_ARTS[item.id];
            const isEquipped = item.equipped;
            const isOwned = item.owned;
            const nameText = isOwned ? `${ma.name}${isEquipped ? ' ★' : ''}` : `${ma.name}（未习得）`;
            const statsText = formatMartialStats(ma);
            const sourceText = isOwned ? statsText : `获取：${ma.source ?? '?'}`;

            // 名称按钮（44 高）
            makeInkButton(list, nameText, {
                x: 0, y, w: 460, h: 44, fontSize: 16,
                bgColor: isEquipped ? '#5A4A2A' : isOwned ? '#3E3A2E' : '#2E2A22',
                borderColor: isEquipped ? '#E8C56A' : isOwned ? '#8E9A6E' : '#5A5A5A',
                textColor: isOwned ? '#F0E6CE' : '#9A9484',
                onClick: isOwned ? () => this.toggleEquip(item) : undefined,
            });
            // 数值说明行（按钮下方 18px 处，用 SHRINK 防止溢出）
            const descNode = new Node('desc');
            list.addChild(descNode);
            descNode.setPosition(0, y - 30, 0);
            const dl = descNode.addComponent(Label);
            dl.string = sourceText;
            dl.fontSize = 12;
            dl.lineHeight = 16;
            dl.color = isOwned ? new Color().fromHEX('#B8B09A') : new Color().fromHEX('#7A7464');
            dl.horizontalAlign = Label.HorizontalAlign.CENTER;
            dl.verticalAlign = Label.VerticalAlign.CENTER;
            dl.overflow = Label.Overflow.SHRINK;
            descNode.addComponent(UITransform).setContentSize(450, 18);
        });

        if (items.length > 6) {
            makeInkLabel(list, `… 共 ${items.length} 门，已显示 6 门`, {
                x: 0, y: 160 - 6 * 72 - 20, fontSize: 13, color: '#8A8474', w: 400, h: 20,
            });
        }
    }

    /** 行囊页：残篇进度 + 背包物品（残篇限行防重叠） */
    private refreshBagList(list: Node, gm: any): void {
        makeInkLabel(list, '行 囊', { x: 0, y: 200, fontSize: 18, bold: true, color: '#F0E6CE', w: 440, h: 26 });

        const fragKeys = Object.keys(gm.state.fragments).filter((k) => (gm.state.fragments[k] ?? 0) > 0);
        // 残篇最多显示 6 行，其余折叠
        const MAX_FRAG = 6;
        const fragLines: string[] = [];
        if (fragKeys.length === 0) {
            fragLines.push('【残篇】暂无残页');
        } else {
            fragLines.push('【残篇】');
            const shown = fragKeys.slice(0, MAX_FRAG);
            for (const k of shown) {
                const ma = MARTIAL_ARTS[k];
                fragLines.push(` ·${ma?.name ?? k} 残页 ${gm.state.fragments[k]}/3`);
            }
            if (fragKeys.length > MAX_FRAG) {
                fragLines.push(` … 其余 ${fragKeys.length - MAX_FRAG} 份残页`);
            }
        }
        // 武器
        const weaponLines: string[] = ['【武器】'];
        for (const wid of gm.state.ownedWeapons) {
            const w = WEAPONS[wid];
            weaponLines.push(` ·${w.name}（${WEAPON_NAMES[w.type]}）${gm.state.weaponId === wid ? ' ★装备中' : ''}`);
        }
        // 战绩
        weaponLines.push(`【战绩】击杀 ${gm.state.kills} 人，问道塔 ${gm.state.maxTowerFloor}/20 层`);

        // 残篇区（上方）
        const fragLabel = makeInkLabel(list, fragLines.join('\n'), {
            x: 0, y: 130, fontSize: 15, color: '#E8DCC0', w: 460, h: 150,
        });
        fragLabel.lineHeight = 24;
        fragLabel.verticalAlign = Label.VerticalAlign.TOP;
        // 武器/战绩区（下方，与残篇区分离不重叠）
        const weaponLabel = makeInkLabel(list, weaponLines.join('\n'), {
            x: 0, y: -40, fontSize: 15, color: '#D8CEB4', w: 460, h: 140,
        });
        weaponLabel.lineHeight = 24;
        weaponLabel.verticalAlign = Label.VerticalAlign.TOP;
    }

        private toggleEquip(item: { id: string; equipped: boolean }): void {
        const gm = GameManager.inst;
        if (this.currentTab === 'bag') return; // 行囊页无装备操作
        const slot = this.currentTab === 'wugong' ? 'wugong' as const : this.currentTab;
        if (item.equipped) {
            if (slot === 'wugong') {
                const idx = gm.state.equipped.wugong.indexOf(item.id);
                if (idx >= 0) gm.unequipMartial('wugong', idx);
            } else {
                gm.unequipMartial(slot);
            }
        } else {
            if (slot === 'wugong') {
                const emptyIdx = gm.state.equipped.wugong.findIndex((x) => x === undefined);
                if (emptyIdx >= 0) gm.equipMartial(item.id, 'wugong', emptyIdx);
                else EventBus.emit(Events.TOAST, '武功槽已满，先卸下再装备');
            } else {
                gm.equipMartial(item.id, slot);
            }
        }
        this.refresh();
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
