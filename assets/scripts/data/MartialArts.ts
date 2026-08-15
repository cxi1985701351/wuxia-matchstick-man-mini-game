import { MartialArtDef, MartialType, WeaponType } from './GameTypes.ts';

/**
 * 墨江湖 - 武学配置表
 * 内功(6) + 轻功(6) + 武功(15，每武器3招)
 */
export const MARTIAL_ARTS: Record<string, MartialArtDef> = {
    // ============ 内功 ============
    tunajue: {
        id: 'tunajue', name: '吐纳诀', type: MartialType.NeiGong,
        desc: '最基础的呼吸吐纳法门，稳固根基。',
        mods: { mp: 30, hp: 20, mpRegen: 1 },
        source: '初始自带',
    },
    shaoyanggong: {
        id: 'shaoyanggong', name: '少阳功', type: MartialType.NeiGong,
        desc: '引朝阳之气入体，出手刚猛。',
        mods: { atk: 3, crit: 0.05 },
        source: '切磋墨虚子后请教',
    },
    guixigong: {
        id: 'guixigong', name: '龟息功', type: MartialType.NeiGong,
        desc: '仿灵龟蛰伏之法，皮糙肉厚，受击反震。',
        mods: { def: 5, hp: 50 },
        passives: ['counter'],
        source: '塔 5 层奖励',
    },
    xuannvjue: {
        id: 'xuannvjue', name: '玄女诀', type: MartialType.NeiGong,
        desc: '阴柔内功，身法飘忽，气血绵长。',
        mods: { hp: 80, dodge: 0.05 },
        source: '峨眉师太传授',
    },
    zixiashengong: {
        id: 'zixiashengong', name: '紫霞神功', type: MartialType.NeiGong,
        desc: '紫气东来，内力雄浑，招招凌厉。',
        mods: { mp: 80, atk: 4, cdReduce: 0.1 },
        source: '武当冲虚道长传授',
    },
    chunyangong: {
        id: 'chunyangong', name: '纯阳功', type: MartialType.NeiGong,
        desc: '纯阳至刚，气血如江海奔涌，生生不息。',
        mods: { hp: 150, atk: 6, hpRegen: 0.01 },
        source: '墨渊老祖传授 / 塔 15 层奖励',
    },

    // ============ 轻功 ============
    jianbugong: {
        id: 'jianbugong', name: '健步功', type: MartialType.QingGong,
        desc: '脚踏实地，稳步前行。',
        mods: { spd: 20 },
        source: '初始自带',
    },
    yanxingshu: {
        id: 'yanxingshu', name: '燕行术', type: MartialType.QingGong,
        desc: '身轻如燕，掠地而行。',
        mods: { spd: 50, dodge: 0.03 },
        source: '切磋李青山后请教',
    },
    caoshangfei: {
        id: 'caoshangfei', name: '草上飞', type: MartialType.QingGong,
        desc: '踏草无痕，出手如风。',
        mods: { spd: 80, atkSpd: 0.1 },
        source: '塔 8 层奖励',
    },
    tiyunzong: {
        id: 'tiyunzong', name: '梯云纵', type: MartialType.QingGong,
        desc: '一纵数丈，可借力腾挪，解锁冲刺。',
        mods: { spd: 100, dodge: 0.08 },
        passives: ['dash'],
        source: '醉乞丐传授',
    },
    taboxing: {
        id: 'taboxing', name: '踏波行', type: MartialType.QingGong,
        desc: '凌波微步，踏水而行，闪避如鬼魅。',
        mods: { spd: 130, dodge: 0.15, dashCd: 0.3 },
        passives: ['dash'],
        source: '塔 12 层奖励',
    },
    suodichengcun: {
        id: 'suodichengcun', name: '缩地成寸', type: MartialType.QingGong,
        desc: '缩千里于方寸，疾如闪电，冲刺可穿人。',
        mods: { spd: 180, atkSpd: 0.2, dodge: 0.1 },
        passives: ['dash', 'dashPierce'],
        source: '墨渊老祖传授',
    },

    // ============ 武功：剑 ============
    jichujianshi: {
        id: 'jichujianshi', name: '基础剑式', type: MartialType.WuGong, weapon: WeaponType.Sword,
        desc: '入门剑法，一式一刺，中正平和。',
        skill: { id: 'jichujianshi', name: '基础剑式', multiplier: 1.0, cooldown: 0, mpCost: 5, range: 130, hitCount: 1, fx: 'slash' },
        source: '初始自带',
    },
    luoyingjianfa: {
        id: 'luoyingjianfa', name: '落英剑法', type: MartialType.WuGong, weapon: WeaponType.Sword,
        desc: '剑花如落英缤纷，二连击出。',
        skill: { id: 'luoyingjianfa', name: '落英剑法', multiplier: 1.6, cooldown: 1, mpCost: 15, range: 135, hitCount: 2, fx: 'slash' },
        source: '李青山残页 x3',
    },
    poshijiujian: {
        id: 'poshijiujian', name: '破式九剑', type: MartialType.WuGong, weapon: WeaponType.Sword,
        desc: '专破天下武学，无视半数防御。',
        skill: { id: 'poshijiujian', name: '破式九剑', multiplier: 2.2, cooldown: 3, mpCost: 30, range: 150, hitCount: 1, ignoreDef: 0.5, fx: 'slash' },
        source: '华山剑圣传授 / 塔 10 层奖励',
    },

    // ============ 武功：弓 ============
    jichujianshu: {
        id: 'jichujianshu', name: '基础箭术', type: MartialType.WuGong, weapon: WeaponType.Bow,
        desc: '挽弓搭箭，百步穿杨。',
        skill: { id: 'jichujianshu', name: '基础箭术', multiplier: 1.0, cooldown: 0, mpCost: 5, range: 420, hitCount: 1, fx: 'arrow' },
        source: '初始自带',
    },
    zhuifengjian: {
        id: 'zhuifengjian', name: '追风箭', type: MartialType.WuGong, weapon: WeaponType.Bow,
        desc: '箭出追风，中者被击退数步。',
        skill: { id: 'zhuifengjian', name: '追风箭', multiplier: 1.5, cooldown: 1, mpCost: 12, range: 440, hitCount: 1, knockback: 60, fx: 'arrow' },
        source: '塔 6 层奖励',
    },
    luorishenjian: {
        id: 'luorishenjian', name: '落日神箭', type: MartialType.WuGong, weapon: WeaponType.Bow,
        desc: '一箭贯日，可穿透阻挡。',
        skill: { id: 'luorishenjian', name: '落日神箭', multiplier: 2.5, cooldown: 3, mpCost: 35, range: 520, hitCount: 1, pierce: true, fx: 'arrow' },
        source: '血影老祖传授',
    },

    // ============ 武功：琴 ============
    jichuqinyin: {
        id: 'jichuqinyin', name: '基础琴音', type: MartialType.WuGong, weapon: WeaponType.Guqin,
        desc: '琴音涤荡，波及周身。',
        skill: { id: 'jichuqinyin', name: '基础琴音', multiplier: 0.8, cooldown: 0, mpCost: 5, range: 150, hitCount: 1, aoe: 80, fx: 'wave' },
        source: '初始自带',
    },
    gaoshanliushui: {
        id: 'gaoshanliushui', name: '高山流水', type: MartialType.WuGong, weapon: WeaponType.Guqin,
        desc: '高山巍巍，流水潺潺，闻者步履蹒跚。',
        skill: { id: 'gaoshanliushui', name: '高山流水', multiplier: 1.4, cooldown: 2, mpCost: 20, range: 160, hitCount: 1, aoe: 120, slow: 0.4, fx: 'wave' },
        source: '峨眉师太残页 x3',
    },
    guanglingsan: {
        id: 'guanglingsan', name: '广陵散', type: MartialType.WuGong, weapon: WeaponType.Guqin,
        desc: '千古绝响，音波震魂，中者眩晕。',
        skill: { id: 'guanglingsan', name: '广陵散', multiplier: 2.0, cooldown: 3, mpCost: 40, range: 180, hitCount: 1, aoe: 150, stun: 1.5, fx: 'wave' },
        source: '塔 14 层奖励',
    },

    // ============ 武功：刀 ============
    jichudao: {
        id: 'jichudao', name: '基础刀法', type: MartialType.WuGong, weapon: WeaponType.Blade,
        desc: '大开大合，力劈华山。',
        skill: { id: 'jichudao', name: '基础刀法', multiplier: 1.2, cooldown: 0, mpCost: 5, range: 110, hitCount: 1, fx: 'smash' },
        source: '初始自带',
    },
    pojundao: {
        id: 'pojundao', name: '破军刀法', type: MartialType.WuGong, weapon: WeaponType.Blade,
        desc: '刀势破军，先破甲而后击。',
        skill: { id: 'pojundao', name: '破军刀法', multiplier: 1.8, cooldown: 2, mpCost: 18, range: 120, hitCount: 1, armorBreak: 0.3, fx: 'smash' },
        source: '醉乞丐残页 x3',
    },
    kuangdaojue: {
        id: 'kuangdaojue', name: '狂刀决', type: MartialType.WuGong, weapon: WeaponType.Blade,
        desc: '伤敌一千自损八百，刀刀见血。',
        skill: { id: 'kuangdaojue', name: '狂刀决', multiplier: 2.4, cooldown: 3, mpCost: 38, range: 125, hitCount: 1, selfHurt: 0.05, fx: 'smash' },
        source: '血影老祖残页 x3',
    },

    // ============ 武功：枪 ============
    jichuqiang: {
        id: 'jichuqiang', name: '基础枪法', type: MartialType.WuGong, weapon: WeaponType.Spear,
        desc: '枪出如龙，直捣黄龙。',
        skill: { id: 'jichuqiang', name: '基础枪法', multiplier: 1.1, cooldown: 0, mpCost: 5, range: 220, hitCount: 1, fx: 'thrust' },
        source: '初始自带',
    },
    panlongqiang: {
        id: 'panlongqiang', name: '盘龙枪法', type: MartialType.WuGong, weapon: WeaponType.Spear,
        desc: '枪随身转，盘龙突进。',
        skill: { id: 'panlongqiang', name: '盘龙枪法', multiplier: 1.7, cooldown: 1, mpCost: 16, range: 240, hitCount: 1, dash: 90, fx: 'thrust' },
        source: '塔 9 层奖励',
    },
    bainiaoqiangjue: {
        id: 'bainiaoqiangjue', name: '百鸟枪决', type: MartialType.WuGong, weapon: WeaponType.Spear,
        desc: '枪影万千如百鸟归巢，三连刺。',
        skill: { id: 'bainiaoqiangjue', name: '百鸟枪决', multiplier: 2.3, cooldown: 3, mpCost: 36, range: 250, hitCount: 3, fx: 'thrust' },
        source: '华山剑圣残页 x3 / 塔 18 层奖励',
    },
};

/** 初始自带武学 */
export const START_MARTIALS = ['tunajue', 'jianbugong', 'jichujianshi'];

/** 按武器获取武功列表 */
export function getWugongByWeapon(weapon: WeaponType): MartialArtDef[] {
    return Object.values(MARTIAL_ARTS).filter(
        (m) => m.type === MartialType.WuGong && m.weapon === weapon,
    );
}
