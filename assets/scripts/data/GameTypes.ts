/**
 * 墨江湖 - 全局类型定义
 * 纯数据定义，不依赖 cc，便于单测与配置驱动。
 */

/** 武学类型 */
export enum MartialType {
    NeiGong = 'neigong',      // 内功
    QingGong = 'qinggong',    // 轻功
    WuGong = 'wugong',        // 武功（主动招式）
}

/** 武器类型 */
export enum WeaponType {
    Sword = 'sword',  // 剑
    Bow = 'bow',      // 弓
    Guqin = 'guqin',  // 琴
    Blade = 'blade',  // 刀
    Spear = 'spear',  // 枪
    Umbrella = 'umbrella', // 伞（血衣阁）
    Fist = 'fist',    // 拳（两仪门）
}

/** 属性修正（武学/武器提供的属性加成） */
export interface StatMods {
    hp: number;        // 气血上限加成
    mp: number;        // 内力上限加成
    atk: number;       // 攻击加成
    def: number;       // 防御加成
    spd: number;       // 移速加成(px/s)
    dodge: number;     // 闪避率加成(0-1)
    crit: number;      // 暴击率加成(0-1)
    mpRegen: number;   // 内力回复/s
    hpRegen: number;   // 气血回复/s
    cdReduce: number;  // 技能冷却缩减(0-1)
    dashCd: number;    // 冲刺冷却缩减(0-1)
}

/** 主动技能（武功）定义 */
export interface SkillDef {
    id: string;
    name: string;
    /** 伤害倍率（乘以攻击力，单段） */
    multiplier: number;
    /** 冷却回合数（回合制：1=隔1回合可用，2=隔2回合，0=无限制） */
    cooldown: number;
    /** 内力消耗 */
    mpCost: number;
    /** 射程(px)（仅数值展示，回合制无距离判定） */
    range: number;
    /** 连击段数 */
    hitCount: number;
    /** 无视防御比例(0-1) */
    ignoreDef?: number;
    /** 减速比例(0-1)，持续 2 回合 */
    slow?: number;
    /** 眩晕回合数 */
    stun?: number;
    /** 自损气血比例(0-1) */
    selfHurt?: number;
    /** 必定命中（无视闪避） */
    trueStrike?: boolean;
    /** 吸血比例(0-1)：回复造成伤害的比例 */
    lifesteal?: number;
    /** 范围伤害半径(px)，0=单体（1v1 下仅作展示） */
    aoe?: number;
    /** 降低目标防御比例(0-1)，持续 2 回合 */
    armorBreak?: number;
    /** 中毒：每回合造成 攻击方 atk × poison 伤害，持续 2 回合（施放时固化伤害值） */
    poison?: number;
    /** 特效类型 */
    fx?: 'slash' | 'arrow' | 'wave' | 'thrust' | 'smash' | 'spin' | 'punch';
}

/** 武学定义 */
export interface MartialArtDef {
    id: string;
    name: string;
    type: MartialType;
    desc: string;
    /** 武功绑定的武器类型（仅 WuGong 有效） */
    weapon?: WeaponType;
    /** 属性修正 */
    mods?: Partial<StatMods>;
    /** 被动标识（内功/轻功被动效果） */
    passives?: string[];
    /** 主动技能（仅 WuGong 有效） */
    skill?: SkillDef;
    /** 获取途径描述 */
    source?: string;
    /** 是否基础武学（作为普攻使用，不占技能槽） */
    isBasic?: boolean;
}

/** 武器定义 */
export interface WeaponDef {
    id: string;
    name: string;
    type: WeaponType;
    desc: string;
    /** 基础攻击 */
    atk: number;
    /** 攻击距离(px)（仅数值展示） */
    range: number;
    /** 速度修正（影响回合先后手，默认 0） */
    spdMod?: number;
    /** 闪避修正(0-1，默认 0) */
    dodgeMod?: number;
    /** 获取途径描述 */
    source?: string;
}

/** NPC 定义 */
export interface NpcDef {
    id: string;
    name: string;
    title: string;
    level: number;
    /** 地图位置 */
    pos: { x: number; y: number };
    /** 固定对话 */
    dialog: string[];
    /** 是否可切磋 */
    canFight: boolean;
    /** 切磋获胜奖励：修为 */
    xp: number;
    /** 掉落武学残页 id */
    dropMartial?: string;
    /** 直接传授武学（请教） */
    teachMartial?: string;
    /** 掉落武器 */
    dropWeapon?: string;
    /** 此 NPC 使用的武器 */
    weapon: WeaponType;
    /** 此 NPC 使用的武功 id（战斗中用） */
    skillIds: string[];
    /** 水墨剪影色调（0-1 墨色深浅） */
    inkTone?: number;
    /** 角色身份（第一章流程用） */
    role?: 'master' | 'recruiter' | 'disciple' | 'villager' | 'townsfolk' | 'stump';
    /** 所属门派 id（Sects.ts） */
    sectId?: string;
    /** 所属区域 id（第一章区域制；带 region 的 NPC 在区域系统落地前不生成） */
    region?: string;
}

/** 塔层定义 */
export interface TowerFloorDef {
    floor: number;
    guardName: string;
    title: string;
    level: number;
    /** 守卫使用的武器 */
    weapon: WeaponType;
    skillIds: string[];
    /** 属性倍率 */
    statScale: number;
    /** 通关奖励修为 */
    xp: number;
    /** 掉落武学残页 */
    dropMartial?: string;
    /** 掉落武器 */
    dropWeapon?: string;
    /** Boss 标记 */
    isBoss?: boolean;
}

/** 最终属性面板（计算后） */
export interface FighterStats {
    maxHp: number;
    hp: number;
    maxMp: number;
    mp: number;
    atk: number;
    def: number;
    spd: number;       // px/s
    dodge: number;     // 0-1
    crit: number;      // 0-1
    mpRegen: number;   // /s
    hpRegen: number;   // /s
    cdReduce: number;  // 0-1
    dashCd: number;    // 0-1
}

/** 玩家存档状态 */
export interface PlayerState {
    level: number;
    xp: number;
    weaponId: string;
    /** 装备：内功/轻功/武功槽(3) */
    equipped: {
        neigong?: string;
        qinggong?: string;
        wugong: (string | undefined)[];
    };
    /** 已拥有的武学 */
    ownedMartials: string[];
    /** 已拥有的武器 */
    ownedWeapons: string[];
    /** 武学残页计数 */
    fragments: Record<string, number>;
    /** 最高塔层 */
    maxTowerFloor: number;
    /** 累计击杀 */
    kills: number;
    /** 剧情/任务进度标记 */
    flags: Record<string, boolean>;
    /** 剧情物品（玉佩/无字信等） */
    questItems: string[];
    /** 已入门派 id */
    sectId?: string;
    /** 门派称号 */
    sectTitle?: string;
}

/** 任务目标（清单打勾项） */
export interface QuestTarget {
    text: string;
    /** 达成标记（PlayerState.flags 键） */
    flag: string;
}

/** 任务定义（任务日志，Q 键） */
export interface QuestDef {
    id: string;
    title: string;
    desc: string;
    targets: QuestTarget[];
    /** 完成后激活的下一个任务 id */
    next?: string;
}

/** 门派定义（第一章） */
export interface SectDef {
    id: string;
    name: string;
    /** 门派武器 */
    weapon: WeaponType;
    /** 掌门 NPC id */
    masterId: string;
    /** 首席弟子（招募者）NPC id */
    recruiterId: string;
    /** 门派称号 */
    title: string;
    /** 庭院区域 id */
    regionId: string;
}
