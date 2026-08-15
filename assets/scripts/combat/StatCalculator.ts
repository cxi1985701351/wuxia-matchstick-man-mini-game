import { FighterStats, StatMods } from '../data/GameTypes.ts';
import { MARTIAL_ARTS } from '../data/MartialArts.ts';
import { getWeaponById } from '../data/Weapons.ts';

/**
 * 墨江湖 - 属性计算
 * 由 等级 + 装备武学(内功/轻功) + 武器 + 武功槽 计算最终面板。
 */
export class StatCalculator {
    /** 基础属性（无武学无武器） */
    static baseStats(level: number): { hp: number; mp: number; atk: number; def: number } {
        return {
            hp: 100 + level * 15,
            mp: 50 + level * 5,
            atk: 5 + level * 2,
            def: 1 + level,
        };
    }

    /** 汇总武学属性修正（内功+轻功，武功只算被动类） */
    static collectMods(neigong?: string, qinggong?: string, wugong: (string | undefined)[] = []): StatMods {
        const mods: StatMods = {
            hp: 0, mp: 0, atk: 0, def: 0, spd: 0, atkSpd: 0,
            dodge: 0, crit: 0, mpRegen: 0, hpRegen: 0, cdReduce: 0, dashCd: 0,
        };
        const ids = [neigong, qinggong, ...wugong].filter(Boolean) as string[];
        for (const id of ids) {
            const ma = MARTIAL_ARTS[id];
            if (!ma || !ma.mods) continue;
            for (const key of Object.keys(ma.mods) as (keyof StatMods)[]) {
                mods[key] += ma.mods[key] ?? 0;
            }
        }
        return mods;
    }

    /** 计算最终战斗面板 */
    static compute(
        level: number,
        weaponId: string,
        neigong?: string,
        qinggong?: string,
        wugong: (string | undefined)[] = [],
    ): FighterStats {
        const base = this.baseStats(level);
        const weapon = getWeaponById(weaponId);
        const mods = this.collectMods(neigong, qinggong, wugong);

        // hpRegen 存储为比例(0.01=1%/s)或绝对值；纯阳功用 0.01 表示 1%/s
        const hpRegenAbs = mods.hpRegen >= 1 ? mods.hpRegen : base.hp * mods.hpRegen;

        const maxHp = Math.round(base.hp + mods.hp);
        const maxMp = Math.round(base.mp + mods.mp);
        return {
            maxHp,
            hp: maxHp,
            maxMp,
            mp: maxMp,
            atk: Math.round(base.atk + weapon.atk + mods.atk),
            def: Math.round(base.def + mods.def),
            spd: 220 + mods.spd,
            atkSpd: Math.max(0.3, weapon.atkSpd + mods.atkSpd),
            dodge: Math.min(0.6, mods.dodge),
            crit: Math.min(0.6, 0.05 + mods.crit),
            mpRegen: 2 + mods.mpRegen,
            hpRegen: hpRegenAbs,
            cdReduce: Math.min(0.5, mods.cdReduce),
            dashCd: Math.max(0.2, 1.5 * (1 - mods.dashCd)),
        };
    }
}
