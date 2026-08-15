import { sys } from 'cc';
import { PlayerState } from '../data/GameTypes.ts';
import { START_MARTIALS } from '../data/MartialArts.ts';
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
            wugong: ['jichujianshi', undefined, undefined],
        },
        ownedMartials: [...START_MARTIALS],
        ownedWeapons: [START_WEAPON],
        fragments: {},
        maxTowerFloor: 0,
        kills: 0,
    };
}

export class SaveSystem {
    static load(): PlayerState {
        try {
            const raw = sys.localStorage.getItem(SAVE_KEY);
            if (!raw) return createDefaultState();
            const parsed = JSON.parse(raw) as PlayerState;
            // 与默认状态合并，防止字段缺失
            const def = createDefaultState();
            return {
                ...def,
                ...parsed,
                equipped: { ...def.equipped, ...parsed.equipped },
                fragments: { ...parsed.fragments },
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
