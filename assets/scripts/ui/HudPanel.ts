import { _decorator, Component, Node, Label, Color, UITransform, Graphics } from 'cc';
import { GameManager } from '../core/GameManager.ts';
import { EventBus, Events } from '../core/EventBus.ts';
import { SaveSystem } from '../core/SaveSystem.ts';
import { FighterStats } from '../data/GameTypes.ts';
import { MARTIAL_ARTS } from '../data/MartialArts.ts';
import { getWeaponById } from '../data/Weapons.ts';
import { WEAPON_NAMES } from '../combat/DamageFormula.ts';
import { makeInkLabel, makeInkButton } from './UiKit.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 主 HUD
 * 左上：气血/内力水墨条 + 境界；左下：武学快捷栏；右上：武器信息。
 * 背景与文字分离，避免重叠。
 */
@ccclass('HudPanel')
export class HudPanel extends Component {
    private hpFill: Graphics | null = null;
    private mpFill: Graphics | null = null;
    private hpLabel: Label | null = null;
    private mpLabel: Label | null = null;
    private realmLabel: Label | null = null;
    private weaponLabel: Label | null = null;
    private skillLabels: Label[] = [];
    private saveInfoLabel: Label | null = null;

    onLoad(): void {
        EventBus.on(Events.PLAYER_STATE_CHANGED, this.refresh, this);
        EventBus.on(Events.WEAPON_CHANGED, this.refresh, this);
        this.build();
        this.refresh(GameManager.inst.state, GameManager.inst.stats);
    }

    onDestroy(): void {
        EventBus.off(Events.PLAYER_STATE_CHANGED, this.refresh, this);
        EventBus.off(Events.WEAPON_CHANGED, this.refresh, this);
    }

    private build(): void {
        const root = this.node;

        // ===== 左上：境界称号 =====
        this.realmLabel = makeInkLabel(root, '', {
            x: -470, y: 312, fontSize: 20, bold: true, color: '#5A4630', w: 320, h: 26,
        });
        this.realmLabel.horizontalAlign = Label.HorizontalAlign.LEFT;

        // 气血条（背景节点 + 填充子节点）
        const hpBg = new Node('hpBg');
        root.addChild(hpBg);
        hpBg.setPosition(-470, 268, 0);
        const bgG = hpBg.addComponent(Graphics);
        bgG.lineWidth = 2;
        bgG.strokeColor.fromHEX('#3A3328');
        bgG.roundRect(-95, -14, 190, 28, 6);
        bgG.stroke();
        bgG.fillColor.set(245, 239, 226, 220);
        bgG.roundRect(-95, -14, 190, 28, 6);
        bgG.fill();
        // 填充
        const hpFillNode = new Node('hpFill');
        hpBg.addChild(hpFillNode);
        hpFillNode.setPosition(0, 0, 0);
        const hpG = hpFillNode.addComponent(Graphics);
        this.hpFill = hpG;
        // 文字（子节点）
        this.hpLabel = makeInkLabel(hpBg, '', { x: 0, y: 0, fontSize: 15, color: '#FFFFFF', w: 190, h: 28 });

        // 内力条
        const mpBg = new Node('mpBg');
        root.addChild(mpBg);
        mpBg.setPosition(-470, 226, 0);
        const bgM = mpBg.addComponent(Graphics);
        bgM.lineWidth = 2;
        bgM.strokeColor.fromHEX('#3A3328');
        bgM.roundRect(-95, -14, 190, 28, 6);
        bgM.stroke();
        bgM.fillColor.set(235, 230, 215, 220);
        bgM.roundRect(-95, -14, 190, 28, 6);
        bgM.fill();
        const mpFillNode = new Node('mpFill');
        mpBg.addChild(mpFillNode);
        mpFillNode.setPosition(0, 0, 0);
        const mpG = mpFillNode.addComponent(Graphics);
        this.mpFill = mpG;
        this.mpLabel = makeInkLabel(mpBg, '', { x: 0, y: 0, fontSize: 15, color: '#FFFFFF', w: 190, h: 28 });

        // ===== 右上：武器信息 =====
        this.weaponLabel = makeInkLabel(root, '', {
            x: 430, y: 312, fontSize: 19, bold: true, color: '#4A3A28', w: 320, h: 26,
        });
        this.weaponLabel.horizontalAlign = Label.HorizontalAlign.RIGHT;

        // ===== 右上角下方：快捷键提示（含 ESC 退出）=====
        makeInkLabel(root, 'V 宗门 ｜ Q 任务 ｜ C 图鉴 ｜ B 背包 ｜ Esc 存档退出', {
            x: 430, y: 282, fontSize: 12, color: '#6A5C44', w: 340, h: 20,
        }).horizontalAlign = Label.HorizontalAlign.RIGHT;

        // ===== 存档信息 + 手动存档按钮（右上，快捷键提示下方）=====
        this.saveInfoLabel = makeInkLabel(root, '尚未存档', {
            x: 430, y: 250, fontSize: 12, color: '#6A5C44', w: 340, h: 20,
        });
        this.saveInfoLabel.horizontalAlign = Label.HorizontalAlign.RIGHT;
        makeInkButton(root, '存 档', {
            x: 430, y: 206, w: 90, h: 40, fontSize: 16,
            bgColor: '#4A3B2A', borderColor: '#C9B896', textColor: '#F5EAD0',
            onClick: () => {
                GameManager.inst.save();
                EventBus.emit(Events.TOAST, `已保存到${SaveSystem.getCurrentSlotInfo().name}`);
                this.updateSaveInfo();
            },
        });

        // ===== 左下：武学快捷栏 =====
        for (let i = 0; i < 3; i++) {
            const slot = new Node(`skill${i}`);
            root.addChild(slot);
            slot.setPosition(-430 + i * 92, -300, 0);
            const bg = slot.addComponent(Graphics);
            bg.lineWidth = 2;
            bg.strokeColor.fromHEX('#5A4A35');
            bg.roundRect(-40, -26, 80, 52, 8);
            bg.stroke();
            bg.fillColor.set(245, 239, 226, 220);
            bg.roundRect(-40, -26, 80, 52, 8);
            bg.fill();
            const l = makeInkLabel(slot, `${i + 1}.空`, { x: 0, y: 0, fontSize: 13, color: '#3C3020', w: 76, h: 44 });
            l.overflow = Label.Overflow.SHRINK;
            this.skillLabels.push(l);
        }
    }

    private refresh(state: any, stats: FighterStats | null): void {
        if (!stats || !this.hpFill) return;
        // 血条
        this.hpFill.clear();
        this.hpFill.fillColor.fromHEX('#8E3B3B');
        const hpPct = Math.max(0, stats.hp / stats.maxHp);
        this.hpFill.roundRect(-90, -10, 180 * hpPct, 20, 4);
        this.hpFill.fill();
        if (this.hpLabel) this.hpLabel.string = `血 ${Math.round(stats.hp)} / ${stats.maxHp}`;

        // 内力条
        this.mpFill.clear();
        this.mpFill.fillColor.fromHEX('#3B5A7E');
        const mpPct = Math.max(0, stats.mp / stats.maxMp);
        this.mpFill.roundRect(-90, -10, 180 * mpPct, 20, 4);
        this.mpFill.fill();
        if (this.mpLabel) this.mpLabel.string = `内 ${Math.round(stats.mp)} / ${stats.maxMp}`;

        // 境界
        if (this.realmLabel) {
            this.realmLabel.string = `${GameManager.inst.realmName} Lv.${state.level}`;
        }
        // 武器
        if (this.weaponLabel) {
            const w = getWeaponById(state.weaponId);
            this.weaponLabel.string = `${w.name}（${WEAPON_NAMES[w.type]}）`;
        }
        // 技能栏
        for (let i = 0; i < 3; i++) {
            const mid = state.equipped.wugong[i];
            const l = this.skillLabels[i];
            if (l) l.string = mid ? `${i + 1}.${MARTIAL_ARTS[mid].name}` : `${i + 1}.空`;
        }
        this.updateSaveInfo();
    }

    /** 刷新存档位信息（档位名 + 最近保存时间） */
    private updateSaveInfo(): void {
        if (!this.saveInfoLabel) return;
        const info = SaveSystem.getCurrentSlotInfo();
        if (!info.id || !info.updatedAt) {
            this.saveInfoLabel.string = '尚未存档';
            return;
        }
        const d = new Date(info.updatedAt);
        const p = (n: number): string => String(n).padStart(2, '0');
        this.saveInfoLabel.string = `${info.name} · 已存 ${p(d.getHours())}:${p(d.getMinutes())}`;
    }
}
