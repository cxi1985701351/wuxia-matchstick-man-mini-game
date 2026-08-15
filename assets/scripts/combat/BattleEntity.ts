import { EventBus, Events } from '../core/EventBus.ts';
import { SkillDef, WeaponType } from '../data/GameTypes.ts';

/**
 * 墨江湖 - 战斗实体（玩家或 NPC）
 * 持有面板属性、位置、战斗状态；由回合制战斗管理器驱动。
 */
export interface BattleEntityData {
    /** 唯一标识 */
    id: string;
    /** 显示名 */
    name: string;
    /** 面板属性（由 StatCalculator 或 NPC 表计算） */
    stats: {
        maxHp: number; hp: number;
        maxMp: number; mp: number;
        atk: number; def: number;
        spd: number; atkSpd: number;
        dodge: number; crit: number;
        mpRegen: number; hpRegen: number;
        cdReduce: number; dashCd: number;
    };
    /** 武器类型（决定普攻距离） */
    weapon: WeaponType;
    /** 武器射程 */
    weaponRange: number;
    /** 可用技能列表（武功，普攻单独处理） */
    skills: SkillDef[];
    /** 被动标记 */
    passives: string[];
    /** 是否是玩家 */
    isPlayer: boolean;
}

/** 实体位置 */
export interface Vec2 { x: number; y: number; }

export class BattleEntity {
    data: BattleEntityData;
    pos: Vec2 = { x: 0, y: 0 };
    /** 朝向：1 右，-1 左 */
    facing: number = 1;
    alive: boolean = true;

    /** 技能剩余冷却（回合数） */
    skillCds: Record<string, number> = {};
    /** 减速剩余回合 */
    slowTimer: number = 0;
    /** 眩晕剩余回合 */
    stunTimer: number = 0;
    /** 破甲剩余回合（防御降低比例） */
    armorBreakTimer: number = 0;
    armorBreakRate: number = 0;
    /** 本回合防御标记（受到伤害减半） */
    defending: boolean = false;

    constructor(data: BattleEntityData) {
        this.data = data;
        for (const s of data.skills) this.skillCds[s.id] = 0;
    }

    get hp(): number { return this.data.stats.hp; }
    set hp(v: number) { this.data.stats.hp = Math.max(0, Math.min(this.data.stats.maxHp, v)); }
    get mp(): number { return this.data.stats.mp; }
    set mp(v: number) { this.data.stats.mp = Math.max(0, Math.min(this.data.stats.maxMp, v)); }

    /** 有效防御（破甲后） */
    get effDef(): number {
        return this.data.stats.def * (1 - this.armorBreakRate);
    }

    /** 当前移速（减速后；回合制下用于先后手排序） */
    get effSpd(): number {
        const slowRate = this.slowTimer > 0 ? 0.5 : 1;
        return this.data.stats.spd * slowRate;
    }

    /** 是否可行动（非眩晕、存活） */
    get canAct(): boolean {
        return this.alive && this.stunTimer <= 0;
    }

    /** 技能是否可用（内力够 + 冷却结束） */
    skillReady(skill: SkillDef): boolean {
        return this.mp >= skill.mpCost && (this.skillCds[skill.id] ?? 0) <= 0;
    }

    /** 释放技能：扣除内力、设置冷却回合数 */
    castSkill(skill: SkillDef): number {
        this.mp -= skill.mpCost;
        const cd = Math.max(0, Math.round(skill.cooldown * (1 - this.data.stats.cdReduce)));
        this.skillCds[skill.id] = cd;
        EventBus.emit(Events.BATTLE_SKILL_USED, this.data.id, skill.id);
        return cd;
    }

    /** 每回合结束：回复内力/气血、递减冷却与效果、清除防御 */
    tickTurn(): void {
        const s = this.data.stats;
        // 内力回复（每回合）
        this.mp += s.mpRegen * 2;
        // 气血回复（每回合）
        if (s.hpRegen > 0 && this.hp > 0) this.hp += s.hpRegen * 0.05 * s.maxHp;
        // 冷却递减
        for (const k of Object.keys(this.skillCds)) {
            if (this.skillCds[k] > 0) this.skillCds[k] -= 1;
        }
        if (this.slowTimer > 0) this.slowTimer -= 1;
        if (this.stunTimer > 0) this.stunTimer -= 1;
        if (this.armorBreakTimer > 0) {
            this.armorBreakTimer -= 1;
            if (this.armorBreakTimer <= 0) this.armorBreakRate = 0;
        }
        // 防御只持续本回合
        this.defending = false;
    }

    /** 受击：施加减速/眩晕/破甲（回合制持续） */
    applyEffects(res: { slow?: number; stun?: number; armorBreak?: number }): void {
        if (res.slow) this.slowTimer = 2;
        if (res.stun) this.stunTimer = Math.max(1, Math.round(res.stun));
        if (res.armorBreak) {
            this.armorBreakRate = res.armorBreak;
            this.armorBreakTimer = 2;
        }
    }

    /** 按距离判断技能能否命中（目标位置） */
    skillInRange(skill: SkillDef, targetPos: Vec2): boolean {
        const dx = targetPos.x - this.pos.x;
        const dy = targetPos.y - this.pos.y;
        return Math.sqrt(dx * dx + dy * dy) <= skill.range;
    }

    distTo(other: BattleEntity): number {
        const dx = other.pos.x - this.pos.x;
        const dy = other.pos.y - this.pos.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
