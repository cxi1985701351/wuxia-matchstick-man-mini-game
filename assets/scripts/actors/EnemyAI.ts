import { _decorator, Component } from 'cc';
import { CombatManager, BattleAction } from '../combat/CombatManager.ts';
import { BattleEntity } from '../combat/BattleEntity.ts';
import { Stickman, StickPose } from './Stickman.ts';
import { EventBus, Events } from '../core/EventBus.ts';
import { SkillDef } from '../data/GameTypes.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 敌人回合制 AI
 * 挂在战斗界面的敌人节点上。
 * 由 CombatManager 在敌人回合时调用 decide() 决策行动。
 */
@ccclass('EnemyAI')
export class EnemyAI extends Component {
    private stickman: Stickman | null = null;
    private bound: boolean = false;

    onLoad(): void {
        this.stickman = this.getComponent(Stickman) || this.node.getComponentInChildren(Stickman);
        EventBus.on(Events.BATTLE_END, this.onBattleEnd, this);
    }

    onDestroy(): void {
        EventBus.off(Events.BATTLE_END, this.onBattleEnd, this);
    }

    /** 战斗开始时由 WorldManager 调用 */
    bind(): void {
        this.bound = true;
        // 把自身引用挂到 CombatManager，供回合调用（避免 getComponent 字符串匹配问题）
        const cm = CombatManager.inst;
        (cm as any).enemyAI = this;
    }

    unbind(): void {
        this.bound = false;
        const cm = CombatManager.inst;
        if ((cm as any).enemyAI === this) (cm as any).enemyAI = null;
    }

    /** 由 CombatManager 在敌人回合调用：决策并提交行动 */
    decide(cm: CombatManager, me: BattleEntity): void {
        if (!this.bound || !cm.inBattle || !me.alive) return;
        // 回合制：无距离限制

        // 眩晕时不行动（提交防御占位）
        if (!me.canAct) {
            cm.enemyAct({ type: 'defend' });
            return;
        }

        // 优先技能：冷却好 + 内力够（回合制无射程限制）
        const readySkill = me.data.skills.find(
            (s) => me.skillReady(s),
        );
        if (readySkill && Math.random() < 0.75) {
            cm.enemyAct({ type: 'skill', skill: readySkill });
            return;
        }
        // 防御：血少时有概率
        if (me.hp < me.data.stats.maxHp * 0.3 && Math.random() < 0.5) {
            cm.enemyAct({ type: 'defend' });
            return;
        }
        // 普攻
        cm.enemyAct({ type: 'basic' });
    }

    private onBattleEnd(): void {
        this.bound = false;
    }
}
