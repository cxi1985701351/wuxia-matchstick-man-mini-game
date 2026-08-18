import { sys } from 'cc';
import { PlayerState } from '../data/GameTypes.ts';
import { START_MARTIALS, MARTIAL_ARTS } from '../data/MartialArts.ts';
import { START_WEAPON } from '../data/Weapons.ts';

/**
 * 墨江湖 - 本地存档系统（多存档位）
 * 3 个存档位（slot_1/2/3），各自独立 localStorage 键：
 *   mojiang_save_slot_N  = 该位 PlayerState JSON
 *   mojiang_current_slot = 当前选中存档位
 *   mojiang_slot_meta    = { slot_N: 更新时间戳 }
 * 旧版单档键 mojiang_save_v1 在首次启动时自动迁移到 slot_1。
 */
const SLOT_IDS = ['slot_1', 'slot_2', 'slot_3'] as const;
export type SlotId = (typeof SLOT_IDS)[number];
const CURRENT_KEY = 'mojiang_current_slot';
const META_KEY = 'mojiang_slot_meta';
const LEGACY_KEY = 'mojiang_save_v1';

const slotKey = (id: string): string => `mojiang_save_${id}`;

export interface SlotInfo {
    id: string;
    state: PlayerState | null;
    /** 最后保存时间戳（毫秒，0 = 无存档） */
    updatedAt: number;
}

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

function readRaw(key: string): string | null {
    try {
        return sys.localStorage.getItem(key);
    } catch (e) {
        console.warn('[SaveSystem] read failed:', key, e);
        return null;
    }
}

function writeRaw(key: string, val: string): void {
    try {
        sys.localStorage.setItem(key, val);
    } catch (e) {
        console.warn('[SaveSystem] write failed:', key, e);
    }
}

function removeRaw(key: string): void {
    try {
        sys.localStorage.removeItem(key);
    } catch (e) {
        console.warn('[SaveSystem] remove failed:', key, e);
    }
}

/** 解析并合并默认值（旧档迁移：新字段取默认值） */
function parseMerged(raw: string): PlayerState | null {
    try {
        const parsed = JSON.parse(raw) as PlayerState;
        const def = createDefaultState();
        return {
            ...def,
            ...parsed,
            equipped: {
                ...def.equipped,
                ...parsed.equipped,
                wugong: normalizeWugong(parsed.equipped?.wugong),
            },
            fragments: { ...(parsed.fragments ?? {}) },
            flags: { ...def.flags, ...(parsed.flags ?? {}) },
            questItems: Array.isArray(parsed.questItems) ? [...parsed.questItems] : [],
        };
    } catch (e) {
        console.warn('[SaveSystem] parse failed, ignore:', e);
        return null;
    }
}

function readMeta(): Record<string, number> {
    try {
        const raw = sys.localStorage.getItem(META_KEY);
        return raw ? (JSON.parse(raw) as Record<string, number>) : {};
    } catch {
        return {};
    }
}

function touchMeta(id: string): void {
    const meta = readMeta();
    meta[id] = Date.now();
    writeRaw(META_KEY, JSON.stringify(meta));
}

/** 旧版单档 → slot_1 迁移（仅当从未设置过当前存档位时） */
function migrateLegacyIfNeeded(): void {
    if (SaveSystem.getCurrentSlotId()) return;
    const raw = readRaw(LEGACY_KEY);
    if (raw == null) return;
    const state = parseMerged(raw);
    if (!state) return;
    writeRaw(slotKey('slot_1'), JSON.stringify(state));
    touchMeta('slot_1');
    writeRaw(CURRENT_KEY, 'slot_1');
    removeRaw(LEGACY_KEY);  // 迁移后删除旧键，防止 slot_1 被删后重复迁移
    console.log('[SaveSystem] legacy save migrated to slot_1');
}

export class SaveSystem {
    /** 列出全部存档位（含空位；首次调用时迁移旧档） */
    static listSlots(): SlotInfo[] {
        migrateLegacyIfNeeded();
        const meta = readMeta();
        return SLOT_IDS.map((id) => ({
            id,
            state: this.readSlot(id),
            updatedAt: meta[id] ?? 0,
        }));
    }

    static getCurrentSlotId(): string | null {
        const v = readRaw(CURRENT_KEY);
        return v && SLOT_IDS.includes(v as SlotId) ? v : null;
    }

    /** 存档位显示名 */
    static getSlotName(id: string | null): string {
        if (id === 'slot_1') return '存档 一';
        if (id === 'slot_2') return '存档 二';
        if (id === 'slot_3') return '存档 三';
        return '未存档';
    }

    /** 当前存档位信息（含最近保存时间戳，0 = 从未保存） */
    static getCurrentSlotInfo(): { id: string | null; name: string; updatedAt: number } {
        const id = this.getCurrentSlotId();
        return { id, name: this.getSlotName(id), updatedAt: id ? (readMeta()[id] ?? 0) : 0 };
    }

    static readSlot(id: string): PlayerState | null {
        if (!SLOT_IDS.includes(id as SlotId)) return null;
        const raw = readRaw(slotKey(id));
        return raw != null ? parseMerged(raw) : null;
    }

    /** 选中存档位（返回 false 表示无效 id） */
    static selectSlot(id: string): boolean {
        if (!SLOT_IDS.includes(id as SlotId)) return false;
        writeRaw(CURRENT_KEY, id);
        return true;
    }

    /** 在指定空位新建默认存档并选中 */
    static createSlot(id: string): PlayerState | null {
        if (!SLOT_IDS.includes(id as SlotId)) return null;
        const state = createDefaultState();
        writeRaw(slotKey(id), JSON.stringify(state));
        touchMeta(id);
        writeRaw(CURRENT_KEY, id);
        return state;
    }

    /** 删除存档位（若为当前位则同时清除当前选择） */
    static deleteSlot(id: string): void {
        if (!SLOT_IDS.includes(id as SlotId)) return;
        removeRaw(slotKey(id));
        const meta = readMeta();
        delete meta[id];
        writeRaw(META_KEY, JSON.stringify(meta));
        if (this.getCurrentSlotId() === id) removeRaw(CURRENT_KEY);
    }

    /** 保存到当前存档位（无当前位时自动落到 slot_1 并选中） */
    static save(state: PlayerState): void {
        let id = this.getCurrentSlotId();
        if (!id) {
            id = 'slot_1';
            writeRaw(CURRENT_KEY, id);
        }
        writeRaw(slotKey(id), JSON.stringify(state));
        touchMeta(id);
    }

    /** 读取当前存档位（无任何存档时返回默认状态） */
    static load(): PlayerState {
        migrateLegacyIfNeeded();
        const id = this.getCurrentSlotId();
        if (id) {
            const st = this.readSlot(id);
            if (st) return st;
        }
        return createDefaultState();
    }

    /** 清空全部存档位与选择（调试用） */
    static clearAll(): void {
        for (const id of SLOT_IDS) this.deleteSlot(id);
        removeRaw(CURRENT_KEY);
        removeRaw(META_KEY);
    }
}
