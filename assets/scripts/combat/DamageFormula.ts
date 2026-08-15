import { SkillDef, WeaponType } from '../data/GameTypes.ts';

/** 伤害结果 */
export interface DamageResult {
    damage: number;
    isCrit: boolean;
    isDodge: boolean;
    isHit: boolean;
    /** 附加效果 */
    slow?: number;
    stun?: number;
    armorBreak?: number;
    knockback?: number;
}

export interface DamageContext {
    /** 攻击方攻击力 */
    atk: number;
    /** 目标防御 */
    def: number;
    /** 攻击方暴击率 0-1 */
    crit: number;
    /** 目标闪避率 0-1 */
    dodge: number;
    /** 技能定义（普攻传 null，倍率 1.0） */
    skill?: SkillDef | null;
}

/**
 * 墨江湖 - 伤害公式
 * 命中判定 → 基础伤害 → 浮动 → 暴击 → 附加效果
 */
export class DamageFormula {
    static roll(ctx: DamageContext): DamageResult {
        // 1. 闪避判定
        if (Math.random() < ctx.dodge) {
            return { damage: 0, isCrit: false, isDodge: true, isHit: false };
        }

        // 2. 基础伤害
        const skill = ctx.skill ?? null;
        const mult = skill?.multiplier ?? 1.0;
        const ignoreDef = skill?.ignoreDef ?? 0;
        const effDef = ctx.def * (1 - ignoreDef);
        let damage = ctx.atk * mult - effDef * 0.5;
        damage = Math.max(1, damage);

        // 3. 浮动 0.9~1.1
        damage *= 0.9 + Math.random() * 0.2;

        // 4. 暴击
        let isCrit = false;
        if (Math.random() < ctx.crit) {
            damage *= 1.5;
            isCrit = true;
        }

        const result: DamageResult = {
            damage: Math.round(damage),
            isCrit,
            isDodge: false,
            isHit: true,
            slow: skill?.slow,
            stun: skill?.stun,
            armorBreak: skill?.armorBreak,
            knockback: skill?.knockback,
        };
        return result;
    }
}

/** 普攻上下文（倍率 1.0） */
export function basicAttackCtx(atk: number, def: number, crit: number, dodge: number): DamageResult {
    return DamageFormula.roll({ atk, def, crit, dodge, skill: null });
}

/** 武器类型中文名 */
export const WEAPON_NAMES: Record<WeaponType, string> = {
    [WeaponType.Sword]: '剑',
    [WeaponType.Bow]: '弓',
    [WeaponType.Guqin]: '琴',
    [WeaponType.Blade]: '刀',
    [WeaponType.Spear]: '枪',
};
