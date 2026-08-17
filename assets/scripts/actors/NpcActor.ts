import { _decorator, Component, Node, Label, UITransform, Vec3, Color, Graphics } from 'cc';
import { NpcDef } from '../data/GameTypes.ts';
import { Stickman, StickPose } from './Stickman.ts';
import { CombatManager } from '../combat/CombatManager.ts';
import { EventBus, Events } from '../core/EventBus.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 地图 NPC
 * 显示火柴人 + 名称；玩家靠近按 E 触发对话。
 * 战斗由独立的 EnemyAI 驱动（本组件不参与战斗逻辑）。
 */
@ccclass('NpcActor')
export class NpcActor extends Component {
    npcDef: NpcDef | null = null;
    /** 是否在门派庭院内（首席弟子双地点区分：主城招募者 vs 庭院首席） */
    courtyard: boolean = false;
    private stickman: Stickman | null = null;
    private nameLabel: Label | null = null;
    private interactRadius = 90;

    init(def: NpcDef): void {
        this.npcDef = def;
        const node = this.node;
        // 火柴人
        this.stickman = node.getComponent(Stickman);
        if (!this.stickman) {
            const body = new Node('body');
            node.addChild(body);
            this.stickman = body.addComponent(Stickman);
        }
        this.stickman.weapon = def.weapon;
        this.stickman.inkTone = def.inkTone ?? 0.5;
        this.stickman.facing = -1;

        // 名称标签（SHRINK 固定文本框）
        const nameNode = new Node('name');
        node.addChild(nameNode);
        nameNode.setPosition(0, 60, 0);
        nameNode.addComponent(UITransform);
        const label = nameNode.addComponent(Label);
        label.string = `${def.name} · ${def.title}`;
        label.fontSize = 16;
        label.lineHeight = 20;
        label.color = new Color(60, 60, 60, 220);
        label.isBold = true;
        label.overflow = Label.Overflow.SHRINK;
        this.nameLabel = label;
        label.node.addComponent(UITransform).setContentSize(200, 24);
        const fixName = (): void => {
            if (!label.node.isValid) return;
            const ut = label.node.getComponent(UITransform);
            if (ut) ut.setContentSize(200, 24);
        };
        setTimeout(fixName, 0);

        // 可切磋标记（红点）
        if (def.canFight) {
            const dot = new Node('dot');
            node.addChild(dot);
            dot.setPosition(34, 30, 0);
            dot.addComponent(UITransform);
            const g = dot.addComponent(Graphics);
            g.fillColor.fromHEX('#8E2B2B');
            g.circle(0, 0, 5);
            g.fill();
        }
    }

    /** 玩家是否在交互范围内 */
    isPlayerNear(playerPos: Vec3): boolean {
        const dx = playerPos.x - this.node.position.x;
        const dy = playerPos.y - this.node.position.y;
        return Math.sqrt(dx * dx + dy * dy) < this.interactRadius;
    }

    /** 供 E 键触发 */
    interact(): void {
        if (!this.npcDef) return;
        if (CombatManager.inst.inBattle) return;
        EventBus.emit(Events.NPC_DIALOG_OPEN, this.npcDef, this);
    }
}
