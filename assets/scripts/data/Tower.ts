import { TowerFloorDef, WeaponType } from './GameTypes.ts';

/**
 * 墨江湖 - 问道塔配置表（20 层）
 * 守卫属性 = 基础 × statScale
 */
export const TOWER_FLOORS: TowerFloorDef[] = [
    { floor: 1, guardName: '守塔小厮', title: '炼气一层', level: 2, weapon: WeaponType.Sword, skillIds: ['jichujianshi'], statScale: 1.0, xp: 15 },
    { floor: 2, guardName: '守塔小厮', title: '炼气二层', level: 3, weapon: WeaponType.Sword, skillIds: ['jichujianshi'], statScale: 1.08, xp: 20 },
    { floor: 3, guardName: '看门武师', title: '炼气三层', level: 4, weapon: WeaponType.Blade, skillIds: ['jichudao'], statScale: 1.16, xp: 25 },
    { floor: 4, guardName: '看门武师', title: '炼气四层', level: 5, weapon: WeaponType.Blade, skillIds: ['jichudao'], statScale: 1.24, xp: 30 },
    { floor: 5, guardName: '铜甲卫士', title: '炼气圆满', level: 6, weapon: WeaponType.Sword, skillIds: ['jichujianshi', 'luoyingjianfa'], statScale: 1.33, xp: 40, dropMartial: 'guixigong', isBoss: true },
    { floor: 6, guardName: '疾风射手', title: '筑基一层', level: 7, weapon: WeaponType.Bow, skillIds: ['jichujianshu'], statScale: 1.42, xp: 45, dropMartial: 'xueyupiaoling' },
    { floor: 7, guardName: '疾风射手', title: '筑基二层', level: 8, weapon: WeaponType.Bow, skillIds: ['jichujianshu', 'zhuifengjian'], statScale: 1.51, xp: 50, dropMartial: 'lianzhujian' },
    { floor: 8, guardName: '铁壁武僧', title: '筑基三层', level: 9, weapon: WeaponType.Blade, skillIds: ['jichudao', 'pojundao'], statScale: 1.61, xp: 60, dropMartial: 'caoshangfei' },
    { floor: 9, guardName: '铁壁武僧', title: '筑基四层', level: 10, weapon: WeaponType.Spear, skillIds: ['jichuqiang'], statScale: 1.71, xp: 65, dropMartial: 'sixiangbengquan' },
    { floor: 10, guardName: '雷音法王', title: '筑基圆满', level: 12, weapon: WeaponType.Spear, skillIds: ['jichuqiang', 'panlongqiang'], statScale: 1.82, xp: 80, dropMartial: 'poshijiujian', isBoss: true },
    { floor: 11, guardName: '幻音仙子', title: '金丹一层', level: 13, weapon: WeaponType.Guqin, skillIds: ['jichuqinyin'], statScale: 1.93, xp: 85, dropMartial: 'mihunshanyan' },
    { floor: 12, guardName: '幻音仙子', title: '金丹二层', level: 14, weapon: WeaponType.Guqin, skillIds: ['jichuqinyin', 'gaoshanliushui'], statScale: 2.05, xp: 95, dropMartial: 'taboxing' },
    { floor: 13, guardName: '黑风刀客', title: '金丹三层', level: 15, weapon: WeaponType.Blade, skillIds: ['jichudao', 'pojundao'], statScale: 2.17, xp: 100, dropMartial: 'yinyangheji' },
    { floor: 14, guardName: '黑风刀客', title: '金丹四层', level: 16, weapon: WeaponType.Blade, skillIds: ['pojundao', 'kuangdaojue'], statScale: 2.3, xp: 110, dropMartial: 'guanglingsan' },
    { floor: 15, guardName: '紫霄真人', title: '金丹圆满', level: 18, weapon: WeaponType.Sword, skillIds: ['luoyingjianfa', 'poshijiujian'], statScale: 2.44, xp: 130, dropMartial: 'zixiaoqizhen', isBoss: true },
    { floor: 16, guardName: '落月弓圣', title: '元婴一层', level: 19, weapon: WeaponType.Bow, skillIds: ['jichujianshu', 'zhuifengjian'], statScale: 2.58, xp: 135, dropMartial: 'pozhenqiangjue' },
    { floor: 17, guardName: '落月弓圣', title: '元婴二层', level: 20, weapon: WeaponType.Bow, skillIds: ['zhuifengjian', 'luorishenjian'], statScale: 2.73, xp: 145, dropMartial: 'wushuangdaofa' },
    { floor: 18, guardName: '枪王·岳擎天', title: '元婴三层', level: 22, weapon: WeaponType.Spear, skillIds: ['panlongqiang', 'bainiaoqiangjue'], statScale: 2.89, xp: 160, dropMartial: 'bainiaoqiangjue' },
    { floor: 19, guardName: '枪王·岳擎天', title: '元婴四层', level: 23, weapon: WeaponType.Spear, skillIds: ['bainiaoqiangjue'], statScale: 3.06, xp: 170, dropMartial: 'taixujianyi' },
    { floor: 20, guardName: '塔主·墨天行', title: '元婴圆满', level: 26, weapon: WeaponType.Sword, skillIds: ['poshijiujian', 'luoyingjianfa', 'luorishenjian'], statScale: 3.24, xp: 220, dropWeapon: 'sword', dropMartial: 'tianxingjianjue', isBoss: true },
];

export const TOWER_MAX_FLOOR = TOWER_FLOORS.length;

export function getTowerFloor(floor: number): TowerFloorDef {
    return TOWER_FLOORS[Math.max(0, Math.min(TOWER_FLOORS.length - 1, floor - 1))];
}
