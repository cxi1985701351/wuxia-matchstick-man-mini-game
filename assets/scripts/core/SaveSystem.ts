import { sys } from 'cc';
import { PlayerState } from '../data/GameTypes.ts';
import { START_MARTIALS, MARTIAL_ARTS } from '../data/MartialArts.ts';
import { START_WEAPON } from '../data/Weapons.ts';

/**
 * 墨江湖 - 本地存档系统
 * 使用 localStorage（web 端）持久化玩家状态。
 */
const SAVE_KEY = 'mojiang_save_v1';

export function createDefaultState(): PlayerState {
    return {
        level: 1,
        xp: 0,
        weaponId: START_WEAPON,
        equipped: {
            neigong: 'tunajue',
            qinggong: 'jianbugong',
            // 基础武学作为普攻，不占技能槽；三个槽初始全空
            wugong: [undefined, undefined, undefined],
        },
        ownedMartials: [...START_MARTIALS],
        ownedWeapons: [START_WEAPON],
        fragments: {},
        maxTowerFloor: 0,
        kills: 0,
        flags: {},
        questItems: [],
    };
}

/** 规范化存档：技能槽补足 3 个；基础武学移出槽位（作为普攻） */
function normalizeWugong(wugong: (string | undefined)[] | undefined): (string | undefined)[] {
    const slots: (string | undefined)[] = new Array(3).fill(undefined);
    if (!Array.isArray(wugong)) return slots;
    let idx = 0;
    for (const mid of wugong) {
        if (!mid) continue;
        const ma = MARTIAL_ARTS[mid];
        // 基础武学不再占用槽位（作为普攻）
        if (ma && ma.isBasic) continue;
        if (idx < 3) {
            slots[idx] = mid;
            idx += 1;
        }
    }
    return slots;
}

export class SaveSystem {
    static load(): PlayerState {
        try {
            const raw = sys.localStorage.getItem(SAVE_KEY);
            if (!raw) return createDefaultState();
            const parsed = JSON.parse(raw) as PlayerState;
            // 与默认状态合并，防止字段缺失（旧档迁移：flags/questItems 等新字段取默认值）
            const def = createDefaultState();
            return {
                ...def,
                ...parsed,
                equipped: {
                    ...def.equipped,
                    ...parsed.equipped,
                    // 规范化技能槽（基础武学移出、槽位补足3个）
                    wugong: normalizeWugong(parsed.equipped?.wugong),
                },
                fragments: { ...(parsed.fragments ?? {}) },
                flags: { ...def.flags, ...(parsed.flags ?? {}) },
                questItems: Array.isArray(parsed.questItems) ? [...parsed.questItems] : [],
            };
        } catch (e) {
            console.warn('[SaveSystem] load failed, use default:', e);
            return createDefaultState();
        }
    }

    static save(state: PlayerState): void {
        try {
            sys.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('[SaveSystem] save failed:', e);
        }
    }

    static clear(): void {
        sys.localStorage.removeItem(SAVE_KEY);
    }
}
