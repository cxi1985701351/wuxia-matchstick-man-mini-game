import { MartialArtDef, MartialType, SkillDef, StatMods } from '../data/GameTypes.ts';

/**
 * 墨江湖 - 武学数值格式化
 * 把武学的 mods / skill 配置转成中文数值描述，用于背包面板展示。
 */

/** 属性修正字段中文名 */
const MOD_NAMES: Record<keyof StatMods, string> = {
    hp: '气血上限',
    mp: '内力上限',
    atk: '攻击',
    def: '防御',
    spd: '移速',
    atkSpd: '攻速',
    dodge: '闪避',
    crit: '暴击',
    mpRegen: '内力回复',
    hpRegen: '气血回复',
    cdReduce: '技能冷却',
    dashCd: '冲刺冷却',
};

/** 格式化属性修正：{ hp: 20, spd: 50 } → "气血上限+20，移速+50" */
export function formatMods(mods?: Partial<StatMods>): string {
    if (!mods) return '';
    const parts: string[] = [];
    for (const key of Object.keys(mods) as (keyof StatMods)[]) {
        const v = mods[key];
        if (v === undefined || v === 0) continue;
        const name = MOD_NAMES[key] ?? key;
        // 百分比类（闪避/暴击/攻速/冷却缩减）用百分号，其余直接数值
        if (key === 'dodge' || key === 'crit') {
            parts.push(`${name}+${(v * 100).toFixed(0)}%`);
        } else if (key === 'atkSpd') {
            parts.push(`${name}+${(v * 100).toFixed(0)}%`);
        } else if (key === 'cdReduce' || key === 'dashCd') {
            parts.push(`${name}-${(v * 100).toFixed(0)}%`);
        } else if (key === 'mpRegen' || key === 'hpRegen') {
            if (v >= 1) parts.push(`${name}+${v.toFixed(1)}/s`);
            else parts.push(`${name}+${(v * 100).toFixed(0)}%/s`);
        } else {
            parts.push(`${name}+${v}`);
        }
    }
    return parts.join('，');
}

/** 格式化被动标识 */
const PASSIVE_NAMES: Record<string, string> = {
    counter: '受击反震',
    dash: '解锁冲刺',
    dashPierce: '冲刺可穿人',
};
export function formatPassives(passives?: string[]): string {
    if (!passives || passives.length === 0) return '';
    return passives.map((p) => PASSIVE_NAMES[p] ?? p).join('，');
}

/** 格式化技能效果：倍率/冷却/消耗/射程/特殊效果 */
export function formatSkill(skill?: SkillDef): string {
    if (!skill) return '';
    const parts: string[] = [];
    parts.push(`伤害 ${Math.round(skill.multiplier * 100)}%`);
    if (skill.hitCount > 1) parts.push(`${skill.hitCount} 段`);
    parts.push(skill.cooldown > 0 ? `冷却 ${skill.cooldown} 回合` : `冷却 无`);
    parts.push(`耗内 ${skill.mpCost}`);
    const extras: string[] = [];
    if (skill.ignoreDef) extras.push(`无视防御 ${(skill.ignoreDef * 100).toFixed(0)}%`);
    if (skill.knockback) extras.push(`击退 ${skill.knockback}`);
    if (skill.slow) extras.push(`减速 ${(skill.slow * 100).toFixed(0)}%`);
    if (skill.stun) extras.push(`眩晕 ${skill.stun} 回合`);
    if (skill.selfHurt) extras.push(`自损 ${(skill.selfHurt * 100).toFixed(0)}%`);
    if (skill.pierce) extras.push('穿透');
    if (skill.aoe) extras.push(`范围 ${skill.aoe}`);
    if (skill.dash) extras.push(`突进 ${skill.dash}`);
    if (skill.armorBreak) extras.push(`破甲 ${(skill.armorBreak * 100).toFixed(0)}%`);
    if (extras.length) parts.push(extras.join('、'));
    return parts.join(' ｜ ');
}

/** 生成武学完整数值描述（内功/轻功显示 mods+被动；武功显示技能） */
export function formatMartialStats(ma: MartialArtDef): string {
    if (ma.type === MartialType.WuGong) {
        return formatSkill(ma.skill);
    }
    const parts: string[] = [];
    const mods = formatMods(ma.mods);
    if (mods) parts.push(mods);
    const pass = formatPassives(ma.passives);
    if (pass) parts.push(pass);
    return parts.join('，');
}
