import { _decorator, Component, Node, Label, Color, UITransform } from 'cc';
import { BattleResult } from '../combat/CombatManager.ts';
import { GameManager } from '../core/GameManager.ts';
import { MARTIAL_ARTS } from '../data/MartialArts.ts';
import { getWeaponById } from '../data/Weapons.ts';
import { makeInkPanel, makeInkLabel, makeInkButton } from './UiKit.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 战斗结算面板
 * 显示胜负、奖励（修为/武学/武器）、继续按钮。
 */
@ccclass('BattleOverPanel')
export class BattleOverPanel extends Component {
    isOpen: boolean = false;
    private root: Node | null = null;
    private titleLabel: Label | null = null;
    private rewardLabel: Label | null = null;
    private statLabel: Label | null = null;

    onLoad(): void {
        this.build();
        this.close();
    }

    private build(): void {
        const root = new Node('BattleOver');
        this.node.addChild(root);
        this.root = root;

        makeInkPanel(root, 640, 420, { bg: '#322D26', border: '#C9B896' });

        this.titleLabel = makeInkLabel(root, '胜 利', { x: 0, y: 150, fontSize: 36, bold: true, color: '#F0E6CE', w: 400, h: 46 });

        this.rewardLabel = makeInkLabel(root, '', {
            x: 0, y: 40, fontSize: 22, color: '#EBE4D2', w: 560, h: 130,
        });
        this.rewardLabel.verticalAlign = Label.VerticalAlign.CENTER;

        this.statLabel = makeInkLabel(root, '', { x: 0, y: -70, fontSize: 17, color: '#B8B09A', w: 560, h: 26 });

        makeInkButton(root, '继 续', {
            x: 0, y: -150, w: 200, h: 56, fontSize: 24, bold: true,
            bgColor: '#7A3B3B', borderColor: '#C9B896', textColor: '#F5EAD0',
            onClick: () => this.close(),
        });
    }

    open(result: BattleResult): void {
        this.isOpen = true;
        if (this.root) this.root.active = true;
        if (this.titleLabel) {
            this.titleLabel.string = result.win ? '胜 利' : '败 北';
            this.titleLabel.color = result.win
                ? new Color().fromHEX('#F0E6CE')
                : new Color().fromHEX('#C88A8A');
        }
        const gm = GameManager.inst;
        const rewards: string[] = [];
        if (result.win) {
            rewards.push(`修为 +${result.xp}`);
            if (result.dropMartial) {
                const ma = MARTIAL_ARTS[result.dropMartial];
                const owned = gm.state.ownedMartials.includes(result.dropMartial);
                rewards.push(owned ? `${ma?.name}（已习得）` : `${ma?.name}残页 +1`);
            }
            if (result.dropWeapon) rewards.push(`武器：${getWeaponById(result.dropWeapon).name}`);
        } else {
            rewards.push('胜败乃兵家常事，再接再厉');
        }
        if (this.rewardLabel) this.rewardLabel.string = rewards.join('\n');
        if (this.statLabel) {
            this.statLabel.string = `修为 ${gm.state.xp} / 下阶 ${gm.state.level * 20} ｜ 境界 ${gm.realmName} Lv.${gm.state.level}`;
        }
    }

    close(): void {
        this.isOpen = false;
        if (this.root) this.root.active = false;
    }
}
