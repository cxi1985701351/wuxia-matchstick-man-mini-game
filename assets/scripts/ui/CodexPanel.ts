import { _decorator, Component, Node, Label, Color, UITransform, Graphics } from 'cc';
import { GameManager } from '../core/GameManager.ts';
import { MARTIAL_ARTS } from '../data/MartialArts.ts';
import { WEAPONS } from '../data/Weapons.ts';
import { MartialType, WeaponType, MartialArtDef } from '../data/GameTypes.ts';
import { WEAPON_NAMES } from '../combat/DamageFormula.ts';
import { makeInkPanel, makeInkLabel, makeInkButton } from './UiKit.ts';
import { formatMartialStats } from './MartialFormat.ts';

const { ccclass } = _decorator;

/** 图鉴视图层级 */
enum CodexView {
    Home = 'home',        // 首页：武功/内功/轻功
    Weapon = 'weapon',    // 武器筛选（仅武功）
    List = 'list',        // 武学列表
}

/**
 * 墨江湖 - 独立图鉴模块（C 键打开）
 * 结构：
 *  首页（武功/内功/轻功）
 *    ├─ 武功 → 武器筛选页（全部/剑/弓/琴/刀/枪）→ 武学列表
 *    ├─ 内功 → 全部内功列表
 *    └─ 轻功 → 全部轻功列表
 * 已解锁武学显示完整数值（★装备中），未解锁灰色显示获取方式。
 */
@ccclass('CodexPanel')
export class CodexPanel extends Component {
    isOpen: boolean = false;
    private root: Node | null = null;
    private contentRoot: Node | null = null;
    private titleLabel: Label | null = null;
    private view: CodexView = CodexView.Home;
    private listType: MartialType = MartialType.WuGong;
    private weaponFilter: 'all' | WeaponType = 'all';
    /** 列表当前页（0 起） */
    private page: number = 0;
    /** 每页显示条数 */
    private readonly perPage = 6;

    onLoad(): void {
        this.build();
        this.close();
    }

    private build(): void {
        const root = new Node('CodexPanel');
        this.node.addChild(root);
        this.root = root;

        // 面板背景（全屏深色，覆盖大世界）
        const bg = root.addComponent(Graphics);
        bg.fillColor.set(20, 16, 12, 245);
        bg.rect(-1000, -700, 2000, 1400);
        bg.fill();

        // 主面板框
        makeInkPanel(root, 820, 620, { bg: '#322D26', border: '#C9B896' });

        // 标题
        this.titleLabel = makeInkLabel(root, '武 学 图 鉴', { x: 0, y: 270, fontSize: 30, bold: true, color: '#F0E6CE', w: 500, h: 40 });

        // 关闭按钮
        makeInkButton(root, '×', {
            x: 380, y: 270, w: 50, h: 50, fontSize: 28,
            bgColor: '#7A3B3B', borderColor: '#C9B896', textColor: '#F5EAD0',
            onClick: () => this.close(),
        });

        // 内容区
        this.contentRoot = new Node('content');
        root.addChild(this.contentRoot);
        this.contentRoot.setPosition(0, 10, 0);

        this.showHome();
    }

    // ============ 视图切换 ============

    private clear(): void {
        if (this.contentRoot) this.contentRoot.removeAllChildren();
    }

    /** 首页：三大分类 */
    private showHome(): void {
        this.view = CodexView.Home;
        this.clear();
        if (this.titleLabel) this.titleLabel.string = '武 学 图 鉴';

        makeInkLabel(this.contentRoot!, '选择要查看的武学类型', {
            x: 0, y: 190, fontSize: 18, color: '#B8B09A', w: 500, h: 26,
        });

        const cats = [
            { label: '武 功', sub: '各武器的进阶招式', type: MartialType.WuGong, y: 90 },
            { label: '内 功', sub: '养气筑基之功法', type: MartialType.NeiGong, y: 10 },
            { label: '轻 功', sub: '身法腾挪之术', type: MartialType.QingGong, y: -70 },
        ];
        cats.forEach((c) => {
            makeInkButton(this.contentRoot!, c.label, {
                x: 0, y: c.y, w: 420, h: 56, fontSize: 22, bold: true,
                bgColor: '#4A3B2A', borderColor: '#C9B896', textColor: '#F0E6CE',
                onClick: () => {
                    this.listType = c.type;
                    if (c.type === MartialType.WuGong) {
                        this.showWeaponSelect();
                    } else {
                        this.weaponFilter = 'all';
                        this.showList(true);
                    }
                },
            });
            makeInkLabel(this.contentRoot!, c.sub, { x: 0, y: c.y - 30, fontSize: 13, color: '#8A8474', w: 400, h: 18 });
        });
    }

    /** 武器筛选页（仅武功） */
    private showWeaponSelect(): void {
        this.view = CodexView.Weapon;
        this.clear();
        if (this.titleLabel) this.titleLabel.string = '武 功 图 鉴';

        makeInkLabel(this.contentRoot!, '选择武器查看对应武功', {
            x: 0, y: 190, fontSize: 18, color: '#B8B09A', w: 500, h: 26,
        });

        const opts: { label: string; key: 'all' | WeaponType }[] = [
            { label: '全部武功', key: 'all' },
            { label: '剑', key: WeaponType.Sword },
            { label: '弓', key: WeaponType.Bow },
            { label: '琴', key: WeaponType.Guqin },
            { label: '刀', key: WeaponType.Blade },
            { label: '枪', key: WeaponType.Spear },
        ];
        opts.forEach((o, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            makeInkButton(this.contentRoot!, o.label, {
                x: -150 + col * 300, y: 110 - row * 90, w: 270, h: 64, fontSize: 20, bold: true,
                bgColor: '#4A3B2A', borderColor: '#C9B896', textColor: '#F0E6CE',
                onClick: () => {
                    this.weaponFilter = o.key;
                    this.showList(true);
                },
            });
        });

        makeInkButton(this.contentRoot!, '← 返回', {
            x: 0, y: -200, w: 160, h: 44, fontSize: 17,
            bgColor: '#3E3A2E', borderColor: '#8E8A78', textColor: '#C8C0AA',
            onClick: () => this.showHome(),
        });
    }

    /** 武学列表页 */
    private showList(resetPage = false): void {
        this.view = CodexView.List;
        if (resetPage) this.page = 0;
        this.clear();
        const gm = GameManager.inst;
        const s = gm.state;

        let title = '';
        if (this.listType === MartialType.WuGong) {
            title = this.weaponFilter === 'all' ? '全部武功' : `${WEAPON_NAMES[this.weaponFilter as WeaponType]}系武功`;
        } else if (this.listType === MartialType.NeiGong) {
            title = '全部内功';
        } else {
            title = '全部轻功';
        }
        if (this.titleLabel) this.titleLabel.string = `图鉴 · ${title}`;

        // 收集武学
        let items: { id: string; name: string; desc: string; owned: boolean; equipped: boolean; stats: string; source: string }[] = [];
        for (const key of Object.keys(MARTIAL_ARTS)) {
            const ma = MARTIAL_ARTS[key];
            if (ma.type !== this.listType) continue;
            // 武功：按武器筛选；基础普攻不列入图鉴（已有"普攻"入口）
            if (this.listType === MartialType.WuGong) {
                if (ma.isBasic) continue;
                if (this.weaponFilter !== 'all' && ma.weapon !== this.weaponFilter) continue;
            }
            const owned = s.ownedMartials.includes(key);
            const equipped =
                (ma.type === MartialType.NeiGong && s.equipped.neigong === key) ||
                (ma.type === MartialType.QingGong && s.equipped.qinggong === key) ||
                (ma.type === MartialType.WuGong && s.equipped.wugong.includes(key));
            items.push({
                id: key,
                name: ma.name,
                desc: ma.desc,
                owned,
                equipped,
                stats: formatMartialStats(ma),
                source: ma.source ?? '?',
            });
        }

        // 已解锁优先
        items.sort((a, b) => Number(b.owned) - Number(a.owned));

        // 已解锁优先
        items.sort((a, b) => Number(b.owned) - Number(a.owned));

        // 分页
        const totalPages = Math.max(1, Math.ceil(items.length / this.perPage));
        this.page = Math.min(this.page, totalPages - 1);
        const pageItems = items.slice(this.page * this.perPage, (this.page + 1) * this.perPage);

        // 列表（每页最多 perPage 项）
        pageItems.forEach((item, i) => {
            const y = 170 - i * 62;
            const nameText = item.owned
                ? `${item.name}${item.equipped ? ' ★' : ''}`
                : `${item.name}（未解锁）`;
            const subText = item.owned ? item.stats : `获取：${item.source}`;
            makeInkButton(this.contentRoot!, nameText, {
                x: 0, y, w: 620, h: 40, fontSize: 16,
                bgColor: item.owned ? '#3E3A2E' : '#2E2A22',
                borderColor: item.owned ? '#8E9A6E' : '#5A5A5A',
                textColor: item.owned ? '#F0E6CE' : '#9A9484',
            });
            // 说明行
            const descNode = new Node('desc');
            this.contentRoot!.addChild(descNode);
            descNode.setPosition(0, y - 31, 0);
            const dl = descNode.addComponent(Label);
            dl.string = subText;
            dl.fontSize = 11;
            dl.lineHeight = 14;
            dl.color = item.owned ? new Color().fromHEX('#B8B09A') : new Color().fromHEX('#6E6858');
            dl.horizontalAlign = Label.HorizontalAlign.CENTER;
            dl.verticalAlign = Label.VerticalAlign.CENTER;
            dl.overflow = Label.Overflow.SHRINK;
            descNode.addComponent(UITransform).setContentSize(600, 14);
        });

        // 底部导航区（y=-250）：返回 ｜ 上一页 页码 下一页
        // 返回按钮
        makeInkButton(this.contentRoot!, '← 返回', {
            x: -260, y: -250, w: 130, h: 44, fontSize: 16,
            bgColor: '#3E3A2E', borderColor: '#8E8A78', textColor: '#C8C0AA',
            onClick: () => {
                if (this.listType === MartialType.WuGong) this.showWeaponSelect();
                else this.showHome();
            },
        });
        // 上一页
        const hasPrev = this.page > 0;
        makeInkButton(this.contentRoot!, '← 上一页', {
            x: -90, y: -250, w: 130, h: 44, fontSize: 16,
            bgColor: hasPrev ? '#4A3B2A' : '#2E2A22',
            borderColor: hasPrev ? '#C9B896' : '#5A5A5A',
            textColor: hasPrev ? '#F0E6CE' : '#6A6454',
            onClick: hasPrev ? () => {
                this.page -= 1;
                this.showList();
            } : undefined,
        });
        // 页码
        makeInkLabel(this.contentRoot!, `${this.page + 1} / ${totalPages}`, {
            x: 55, y: -250, fontSize: 16, color: '#E8C56A', w: 80, h: 30,
        });
        // 下一页
        const hasNext = this.page < totalPages - 1;
        makeInkButton(this.contentRoot!, '下一页 →', {
            x: 170, y: -250, w: 130, h: 44, fontSize: 16,
            bgColor: hasNext ? '#4A3B2A' : '#2E2A22',
            borderColor: hasNext ? '#C9B896' : '#5A5A5A',
            textColor: hasNext ? '#F0E6CE' : '#6A6454',
            onClick: hasNext ? () => {
                this.page += 1;
                this.showList();
            } : undefined,
        });
    }

    // ============ 开关 ============

    open(): void {
        this.isOpen = true;
        if (this.root) this.root.active = true;
        this.page = 0;
        this.showHome();
    }

    close(): void {
        this.isOpen = false;
        if (this.root) this.root.active = false;
    }

    toggle(): void {
        if (this.isOpen) this.close();
        else this.open();
    }
}
