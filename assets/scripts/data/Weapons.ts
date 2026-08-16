import { WeaponDef, WeaponType } from './GameTypes.ts';

/**
 * 墨江湖 - 武器配置表
 * 剑/弓/琴/刀/枪，决定基础攻击、攻击距离与可用武功（回合制无攻速）。
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
};

/** 初始武器 */
export const START_WEAPON = 'sword';

export function getWeaponById(id: string): WeaponDef {
    return WEAPONS[id] || WEAPONS[START_WEAPON];
}
