import { WeaponDef, WeaponType } from './GameTypes.ts';

/**
 * 墨江湖 - 武器配置表
 * 剑/弓/琴/刀/枪/伞/拳，决定基础攻击、攻击距离与可用武功（回合制无攻速）。
 */
export const WEAPONS: Record<string, WeaponDef> = {
    sword: {
        id: 'sword', name: '青锋剑', type: WeaponType.Sword,
        desc: '三尺青锋，中庸之道，攻守兼备。',
        atk: 8, range: 130,
        source: '初始自带',
    },
    bow: {
        id: 'bow', name: '惊鸿弓', type: WeaponType.Bow,
        desc: '弓开如满月，箭去似流星。',
        atk: 6, range: 420,
        source: '血影老祖赠送',
    },
    guqin: {
        id: 'guqin', name: '焦尾琴', type: WeaponType.Guqin,
        desc: '名琴焦尾，音波可伤人于无形。',
        atk: 5, range: 160,
        source: '冲虚道长赠送',
    },
    blade: {
        id: 'blade', name: '屠龙刀', type: WeaponType.Blade,
        desc: '宝刀屠龙，重而凌厉。',
        atk: 12, range: 110,
        source: '醉乞丐赠送',
    },
    spear: {
        id: 'spear', name: '玄铁枪', type: WeaponType.Spear,
        desc: '玄铁枪杆，一丈之内唯我独尊。',
        atk: 10, range: 220,
        source: '华山剑圣赠送',
    },
    umbrella: {
        id: 'umbrella', name: '铁骨伞', type: WeaponType.Umbrella,
        desc: '铁骨为骨，油纸为面；伞开可御，伞合为刃。',
        atk: 9, range: 150,
        source: '血衣阁掌门授予',
    },
    fist: {
        id: 'fist', name: '两仪拳套', type: WeaponType.Fist,
        desc: '赤手缠丝，阴阳相济；拳出无形，身法如风。',
        atk: 5, range: 100, spdMod: 40, dodgeMod: 0.05,
        source: '两仪门掌门授予',
    },
};

/** 初始武器 */
export const START_WEAPON = 'sword';

export function getWeaponById(id: string): WeaponDef {
    return WEAPONS[id] || WEAPONS[START_WEAPON];
}
