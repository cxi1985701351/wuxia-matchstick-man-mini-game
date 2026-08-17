import { _decorator, Component, Node, Label, Color, UITransform } from 'cc';
import { NpcDef } from '../data/GameTypes.ts';
import { EventBus, Events } from '../core/EventBus.ts';
import { GameManager } from '../core/GameManager.ts';
import { MARTIAL_ARTS } from '../data/MartialArts.ts';
import { getWeaponById } from '../data/Weapons.ts';
import { makeInkPanel, makeInkLabel, makeInkButton } from './UiKit.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - NPC 对话面板
 * 古风对话框 + 选项按钮（背景与文字分离，确保文字可见）。
 */
@ccclass('NpcDialog')
export class NpcDialog extends Component {
    isOpen: boolean = false;
    private root: Node | null = null;
    private textLabel: Label | null = null;
    private optionRoot: Node | null = null;
    private currentDef: NpcDef | null = null;
    private callback: ((action: string) => void) | null = null;
    private dialogIndex: number = 0;

    onLoad(): void {
        this.build();
        this.close();
    }

    private build(): void {
        const root = new Node('NpcDialog');
        this.node.addChild(root);
        this.root = root;

        // 面板背景
        const panel = makeInkPanel(root, 680, 440);
        panel.setPosition(0, 0, 0);

        // 标题
        this.titleLabel = makeInkLabel(root, '对话', {
            x: 0, y: 175, fontSize: 28, bold: true, color: '#F0E6CE', w: 600, h: 36,
        });

        // 正文
        const text = new Node('text');
        root.addChild(text);
        text.setPosition(0, 40, 0);
        const tLabel = text.addComponent(Label);
        tLabel.fontSize = 22;
        tLabel.lineHeight = 38;
        tLabel.color = new Color(235, 228, 210, 255);
        tLabel.horizontalAlign = Label.HorizontalAlign.CENTER;
        tLabel.verticalAlign = Label.VerticalAlign.CENTER;
        text.addComponent(UITransform).setContentSize(600, 160);
        this.textLabel = tLabel;

        // 选项区
        this.optionRoot = new Node('options');
        root.addChild(this.optionRoot);
        this.optionRoot.setPosition(0, -110, 0);
    }

    private titleLabel: Label | null = null;

    open(def: NpcDef, callback: (action: string) => void, ctx?: { courtyard?: boolean }): void {
        this.currentDef = def;
        this.callback = callback;
        this.dialogIndex = 0;
        this.isOpen = true;
        if (this.root) this.root.active = true;
        this.titleLabel!.string = `${def.name} · ${def.title}`;
        this.showDialog();
        this.buildOptions(def, ctx);
    }

    close(): void {
        this.isOpen = false;
        if (this.root) this.root.active = false;
        this.currentDef = null;
        EventBus.emit(Events.NPC_DIALOG_CLOSE);
    }

    private showDialog(): void {
        const def = this.currentDef;
        if (!def || !this.textLabel) return;
        this.textLabel.string = def.dialog[this.dialogIndex % def.dialog.length];
        this.dialogIndex++;
    }

    private buildOptions(def: NpcDef, ctx?: { courtyard?: boolean }): void {
        if (!this.optionRoot) return;
        this.optionRoot.removeAllChildren();

        const opts: { label: string; action: string }[] = [];
        const joined = GameManager.inst.state.sectId;
        // 第一章流程选项（按角色）
        if (def.role === 'recruiter') {
            // 主城招募者：可前往山门（庭院首席分身不显示）
            if (!ctx?.courtyard) opts.push({ label: '◎ 拜师：前往山门', action: 'goto_sect' });
        } else if (def.role === 'master' && !joined) {
            // 掌门：未入门派时可请求拜师考核
            opts.push({ label: '◎ 拜师考核（与首席弟子切磋）', action: 'trial' });
        }
        if (def.canFight) opts.push({ label: '⚔ 切磋武艺', action: 'fight' });
        if (def.teachMartial) {
            const ma = MARTIAL_ARTS[def.teachMartial];
            opts.push({ label: `◎ 请教武学（${ma?.name ?? ''}）`, action: 'teach' });
        }
        if (def.dropMartial || def.dropWeapon) {
            const drops: string[] = [];
            if (def.dropMartial) drops.push(`「${MARTIAL_ARTS[def.dropMartial]?.name}」残页`);
            if (def.dropWeapon) drops.push(getWeaponById(def.dropWeapon).name);
            opts.push({ label: `▸ 查看掉落（${drops.join('、')}）`, action: 'info' });
        }
        opts.push({ label: '▸ 继续听他说', action: 'more' });
        opts.push({ label: '✕ 离开', action: 'leave' });

        // 选项排布：最多 6 个，两列三行
        opts.forEach((opt, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const x = -175 + col * 350;
            const y = 60 - row * 68;
            makeInkButton(this.optionRoot!, opt.label, {
                x, y, w: 320, h: 52, fontSize: 19,
                bgColor: '#4A3B2A',
                borderColor: '#C9B896',
                textColor: '#F5EAD0',
                onClick: () => this.onOption(opt.action),
            });
        });
    }

    private onOption(action: string): void {
        const def = this.currentDef;
        if (!def) return;
        switch (action) {
            case 'more':
            case 'info':
                this.showDialog();
                break;
            case 'leave':
                this.close();
                break;
            default:
                // fight / teach 交给回调处理（回调内部会 close）
                if (this.callback) {
                    const cb = this.callback;
                    this.callback = null;
                    cb(action);
                }
        }
    }
}
