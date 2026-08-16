import { MartialArtDef, MartialType, WeaponType } from './GameTypes.ts';

/**
 * 墨江湖 - 武学配置表
 * 内功(6) + 轻功(6) + 基础武功(5，作为普攻不占槽) + 进阶武功(15，每武器3招可装备)
 *
 * 数值平衡原则：
 * 普攻不耗内；进阶武功平均回合伤害随 CD 递增：
 *   CD1（每2回合1次）→ 平均约 1.3~1.5
 *   CD2（每3回合1次）→ 平均约 1.6~1.8
 *   CD3（每4回合1次）→ 平均约 1.8~2.0
 * 高 CD 高爆发的平均伤害严格高于低 CD 技能。
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
        source: '墨渊老祖传授',
    },
    zixiaoqizhen: {
        id: 'zixiaoqizhen', name: '紫霄真气', type: MartialType.NeiGong,
        desc: '紫霄宫传世内功，真气雄浑，生生不息。',
        mods: { mp: 100, atk: 5, mpRegen: 2 },
        source: '问道塔 15 层奖励（塔主紫霄真人）',
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
        mods: { spd: 80, mpRegen: 1 },
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
        mods: { spd: 180, dodge: 0.12 },
        passives: ['dash', 'dashPierce'],
        source: '墨渊老祖传授',
    },

    // ============ 基础武功（普攻，不占槽）============
    jichujianshi: {
        id: 'jichujianshi', name: '基础剑式', type: MartialType.WuGong, weapon: WeaponType.Sword,
        desc: '入门剑法，一式一刺，中正平和。持剑时的普攻。',
        skill: { id: 'jichujianshi', name: '基础剑式', multiplier: 1.0, cooldown: 0, mpCost: 0, range: 130, hitCount: 1, fx: 'slash' },
        isBasic: true,
        source: '初始自带',
    },
    jichujianshu: {
        id: 'jichujianshu', name: '基础箭术', type: MartialType.WuGong, weapon: WeaponType.Bow,
        desc: '挽弓搭箭，百步穿杨。持弓时的普攻。',
        skill: { id: 'jichujianshu', name: '基础箭术', multiplier: 1.0, cooldown: 0, mpCost: 0, range: 420, hitCount: 1, fx: 'arrow' },
        isBasic: true,
        source: '初始自带',
    },
    jichuqinyin: {
        id: 'jichuqinyin', name: '基础琴音', type: MartialType.WuGong, weapon: WeaponType.Guqin,
        desc: '琴音涤荡，波及周身。持琴时的普攻。',
        skill: { id: 'jichuqinyin', name: '基础琴音', multiplier: 0.8, cooldown: 0, mpCost: 0, range: 160, hitCount: 1, aoe: 80, fx: 'wave' },
        isBasic: true,
        source: '初始自带',
    },
    jichudao: {
        id: 'jichudao', name: '基础刀法', type: MartialType.WuGong, weapon: WeaponType.Blade,
        desc: '大开大合，力劈华山。持刀时的普攻。',
        skill: { id: 'jichudao', name: '基础刀法', multiplier: 1.2, cooldown: 0, mpCost: 0, range: 110, hitCount: 1, fx: 'smash' },
        isBasic: true,
        source: '初始自带',
    },
    jichuqiang: {
        id: 'jichuqiang', name: '基础枪法', type: MartialType.WuGong, weapon: WeaponType.Spear,
        desc: '枪出如龙，直捣黄龙。持枪时的普攻。',
        skill: { id: 'jichuqiang', name: '基础枪法', multiplier: 1.1, cooldown: 0, mpCost: 0, range: 220, hitCount: 1, fx: 'thrust' },
        isBasic: true,
        source: '初始自带',
    },

    // ============ 进阶武功：剑（基础普攻1.0）============
    luoyingjianfa: {
        id: 'luoyingjianfa', name: '落英剑法', type: MartialType.WuGong, weapon: WeaponType.Sword,
        desc: '剑花如落英缤纷，二连击出。',
        skill: { id: 'luoyingjianfa', name: '落英剑法', multiplier: 1.4, cooldown: 1, mpCost: 15, range: 135, hitCount: 2, fx: 'slash' },
        source: '李青山残页 x3',
    },
    taixujianyi: {
        id: 'taixujianyi', name: '太虚剑意', type: MartialType.WuGong, weapon: WeaponType.Sword,
        desc: '剑意绵绵如太虚，双剑连环。',
        skill: { id: 'taixujianyi', name: '太虚剑意', multiplier: 2.4, cooldown: 2, mpCost: 28, range: 140, hitCount: 2, fx: 'slash' },
        source: '塔 19 层奖励',
    },
    poshijiujian: {
        id: 'poshijiujian', name: '破式九剑', type: MartialType.WuGong, weapon: WeaponType.Sword,
        desc: '专破天下武学，无视三成防御。',
        skill: { id: 'poshijiujian', name: '破式九剑', multiplier: 2.6, cooldown: 3, mpCost: 45, range: 150, hitCount: 3, ignoreDef: 0.3, fx: 'slash' },
        source: '华山剑圣传授 / 塔 10 层奖励',
    },
    tianxingjianjue: {
        id: 'tianxingjianjue', name: '天行剑诀', type: MartialType.WuGong, weapon: WeaponType.Sword,
        desc: '塔主墨天行绝学，剑出天行，无坚不摧。',
        skill: { id: 'tianxingjianjue', name: '天行剑诀', multiplier: 2.8, cooldown: 3, mpCost: 48, range: 155, hitCount: 3, ignoreDef: 0.2, fx: 'slash' },
        source: '问道塔 20 层奖励（塔主墨天行）',
    },

    // ============ 进阶武功：弓（基础普攻1.0）============
    zhuifengjian: {
        id: 'zhuifengjian', name: '追风箭', type: MartialType.WuGong, weapon: WeaponType.Bow,
        desc: '箭出追风，疾如闪电，必中。',
        skill: { id: 'zhuifengjian', name: '追风箭', multiplier: 2.8, cooldown: 1, mpCost: 15, range: 440, hitCount: 1, trueStrike: true, fx: 'arrow' },
        source: '塔 6 层奖励',
    },
    lianzhujian: {
        id: 'lianzhujian', name: '连珠箭', type: MartialType.WuGong, weapon: WeaponType.Bow,
        desc: '三箭连珠，疾射而出。',
        skill: { id: 'lianzhujian', name: '连珠箭', multiplier: 1.7, cooldown: 2, mpCost: 28, range: 450, hitCount: 3, fx: 'arrow' },
        source: '塔 7 层奖励',
    },
    luorishenjian: {
        id: 'luorishenjian', name: '落日神箭', type: MartialType.WuGong, weapon: WeaponType.Bow,
        desc: '一箭贯日，破甲而入。',
        skill: { id: 'luorishenjian', name: '落日神箭', multiplier: 7.2, cooldown: 3, mpCost: 45, range: 520, hitCount: 1, ignoreDef: 0.2, fx: 'arrow' },
        source: '血影老祖传授',
    },

    // ============ 进阶武功：琴（基础普攻0.8）============
    qingxinqu: {
        id: 'qingxinqu', name: '清心曲', type: MartialType.WuGong, weapon: WeaponType.Guqin,
        desc: '曲调清心，余音袅袅，二段音波。',
        skill: { id: 'qingxinqu', name: '清心曲', multiplier: 1.3, cooldown: 1, mpCost: 14, range: 155, hitCount: 2, fx: 'wave' },
        source: '塔 11 层奖励',
    },
    gaoshanliushui: {
        id: 'gaoshanliushui', name: '高山流水', type: MartialType.WuGong, weapon: WeaponType.Guqin,
        desc: '高山巍巍，流水潺潺，闻者步履蹒跚。',
        skill: { id: 'gaoshanliushui', name: '高山流水', multiplier: 1.95, cooldown: 2, mpCost: 25, range: 160, hitCount: 2, aoe: 120, slow: 0.4, fx: 'wave' },
        source: '峨眉师太残页 x3',
    },
    guanglingsan: {
        id: 'guanglingsan', name: '广陵散', type: MartialType.WuGong, weapon: WeaponType.Guqin,
        desc: '千古绝响，音波震魂，中者眩晕。',
        skill: { id: 'guanglingsan', name: '广陵散', multiplier: 2.0, cooldown: 3, mpCost: 45, range: 180, hitCount: 3, aoe: 150, stun: 1, fx: 'wave' },
        source: '塔 14 层奖励',
    },

    // ============ 进阶武功：刀（基础普攻1.2）============
    duanshuiliu: {
        id: 'duanshuiliu', name: '断水流', type: MartialType.WuGong, weapon: WeaponType.Blade,
        desc: '抽刀断水，二连斩。',
        skill: { id: 'duanshuiliu', name: '断水流', multiplier: 1.35, cooldown: 1, mpCost: 15, range: 115, hitCount: 2, fx: 'smash' },
        source: '塔 13 层奖励',
    },
    pojundao: {
        id: 'pojundao', name: '破军刀法', type: MartialType.WuGong, weapon: WeaponType.Blade,
        desc: '刀势破军，先破甲而后击。',
        skill: { id: 'pojundao', name: '破军刀法', multiplier: 2.2, cooldown: 2, mpCost: 26, range: 120, hitCount: 2, armorBreak: 0.3, fx: 'smash' },
        source: '醉乞丐残页 x3',
    },
    kuangdaojue: {
        id: 'kuangdaojue', name: '狂刀决', type: MartialType.WuGong, weapon: WeaponType.Blade,
        desc: '伤敌一千自损八百，三连狂斩。',
        skill: { id: 'kuangdaojue', name: '狂刀决', multiplier: 2.2, cooldown: 3, mpCost: 45, range: 125, hitCount: 3, selfHurt: 0.05, fx: 'smash' },
        source: '血影老祖残页 x3',
    },
    wushuangdaofa: {
        id: 'wushuangdaofa', name: '无双刀法', type: MartialType.WuGong, weapon: WeaponType.Blade,
        desc: '刀法无双，破甲裂防，势不可挡。',
        skill: { id: 'wushuangdaofa', name: '无双刀法', multiplier: 2.4, cooldown: 3, mpCost: 45, range: 130, hitCount: 3, ignoreDef: 0.25, fx: 'smash' },
        source: '问道塔 17 层奖励',
    },

    // ============ 进阶武功：枪（基础普攻1.1）============
    panlongqiang: {
        id: 'panlongqiang', name: '盘龙枪法', type: MartialType.WuGong, weapon: WeaponType.Spear,
        desc: '枪出如龙，必中要害。',
        skill: { id: 'panlongqiang', name: '盘龙枪法', multiplier: 1.5, cooldown: 1, mpCost: 16, range: 240, hitCount: 2, trueStrike: true, fx: 'thrust' },
        source: '塔 9 层奖励',
    },
    pozhenqiangjue: {
        id: 'pozhenqiangjue', name: '破阵枪诀', type: MartialType.WuGong, weapon: WeaponType.Spear,
        desc: '破阵三枪，势不可挡。',
        skill: { id: 'pozhenqiangjue', name: '破阵枪诀', multiplier: 1.8, cooldown: 2, mpCost: 28, range: 245, hitCount: 3, fx: 'thrust' },
        source: '塔 16 层奖励',
    },
    bainiaoqiangjue: {
        id: 'bainiaoqiangjue', name: '百鸟枪决', type: MartialType.WuGong, weapon: WeaponType.Spear,
        desc: '枪影万千如百鸟归巢，三连刺。',
        skill: { id: 'bainiaoqiangjue', name: '百鸟枪决', multiplier: 2.5, cooldown: 3, mpCost: 45, range: 250, hitCount: 3, fx: 'thrust' },
        source: '华山剑圣残页 x3 / 塔 18 层奖励',
    },
};

/** 初始自带武学（基础武学不占槽，仍计入拥有） */
export const START_MARTIALS = ['tunajue', 'jianbugong', 'jichujianshi'];

/** 按武器获取可装备的进阶武功列表（不含基础普攻） */
export function getWugongByWeapon(weapon: WeaponType): MartialArtDef[] {
    return Object.values(MARTIAL_ARTS).filter(
        (m) => m.type === MartialType.WuGong && m.weapon === weapon && !m.isBasic,
    );
}

/** 获取武器对应的基础武学（普攻） */
export function getBasicWugong(weapon: WeaponType): MartialArtDef | undefined {
    return Object.values(MARTIAL_ARTS).find(
        (m) => m.type === MartialType.WuGong && m.weapon === weapon && m.isBasic,
    );
}
