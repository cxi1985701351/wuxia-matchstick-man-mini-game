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
}

/** 属性修正（武学/武器提供的属性加成） */
export interface StatMods {
    hp: number;        // 气血上限加成
    mp: number;        // 内力上限加成
    atk: number;       // 攻击加成
    def: number;       // 防御加成
    spd: number;       // 移速加成(px/s)
    atkSpd: number;    // 攻速加成(倍率, 1=100%)
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
    /** 伤害倍率（乘以攻击力） */
    multiplier: number;
    /** 冷却回合数（回合制：1=下回合可用，2=隔1回合，0=无限制每回合可用） */
    cooldown: number;
    /** 内力消耗 */
    mpCost: number;
    /** 射程(px)（回合制下用于判定攻击距离） */
    range: number;
    /** 连击段数 */
    hitCount: number;
    /** 击退距离(px) */
    knockback?: number;
    /** 无视防御比例(0-1) */
    ignoreDef?: number;
    /** 减速比例(0-1)，持续 2 回合 */
    slow?: number;
    /** 眩晕回合数 */
    stun?: number;
    /** 自损气血比例(0-1) */
    selfHurt?: number;
    /** 是否穿透 */
    pierce?: boolean;
    /** 范围伤害半径(px)，0=单体 */
    aoe?: number;
    /** 是否突进（枪法） */
    dash?: number;
    /** 降低目标防御比例(0-1)，持续 2 回合 */
    armorBreak?: number;
    /** 特效类型 */
    fx?: 'slash' | 'arrow' | 'wave' | 'thrust' | 'smash';
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
}

/** 武器定义 */
export interface WeaponDef {
    id: string;
    name: string;
    type: WeaponType;
    desc: string;
    /** 基础攻击 */
    atk: number;
    /** 攻击距离(px) */
    range: number;
    /** 攻速倍率（越大越快） */
    atkSpd: number;
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
    atkSpd: number;    // 攻速倍率
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
}
