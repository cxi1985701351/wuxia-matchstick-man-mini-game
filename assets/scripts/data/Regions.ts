import { RegionDef } from './GameTypes.ts';

/**
 * 墨江湖 - 第一章区域配置表（10 区域）
 * 单 World 容器 + 区域重建：切换时重绘地面/重建 NPC/瞬移玩家。
 * 布局与传送关系详见 docs/Chapter1_P2_MapDesign.md。
 */
export const REGIONS: Record<string, RegionDef> = {
    // ============ 序章·深山小村 ============
    village: {
        id: 'village', name: '深山小村',
        halfW: 600, halfH: 450,
        ground: 'village',
        npcs: [
            { npcId: 'shenmiren', pos: { x: 0, y: -100 }, facing: 1 },
            { npcId: 'cuntong', pos: { x: 260, y: 120 }, facing: -1 },
            { npcId: 'muzhuang', pos: { x: -260, y: -180 }, facing: 1 },
        ],
        teleports: [
            { id: 'village_to_hub', pos: { x: 0, y: -430 }, to: 'hub', spawn: { x: 0, y: 800 }, label: '下山道' },
        ],
        spawn: { x: 0, y: 0 },
        bgTone: 0.35,
    },

    // ============ 江湖中枢（箱庭通路） ============
    hub: {
        id: 'hub', name: '江湖中枢',
        halfW: 1200, halfH: 900,
        ground: 'hub',
        npcs: [],
        teleports: [
            { id: 'hub_to_village', pos: { x: 0, y: 850 }, to: 'village', spawn: { x: 0, y: -380 }, label: '下山道' },
            { id: 'hub_to_town', pos: { x: 0, y: -850 }, to: 'town', spawn: { x: 0, y: 620 }, label: '主城城门' },
            // 西侧 3 山门
            { id: 'hub_to_jianzong', pos: { x: -750, y: 550 }, to: 'sect_jianzong', spawn: { x: 0, y: 520 }, label: '谪仙剑宗山门' },
            { id: 'hub_to_badaomen', pos: { x: -1050, y: 150 }, to: 'sect_badaomen', spawn: { x: 0, y: 520 }, label: '霸刀门山门' },
            { id: 'hub_to_liuyinge', pos: { x: -800, y: -350 }, to: 'sect_liuyinge', spawn: { x: 0, y: 520 }, label: '流音阁山门' },
            // 东侧 3 山门
            { id: 'hub_to_jinghong', pos: { x: 750, y: 550 }, to: 'sect_jinghong', spawn: { x: 0, y: 520 }, label: '惊鸿山庄山门' },
            { id: 'hub_to_liehun', pos: { x: 1050, y: 150 }, to: 'sect_liehun', spawn: { x: 0, y: 520 }, label: '烈魂枪门山门' },
            { id: 'hub_to_xueyi', pos: { x: 800, y: -350 }, to: 'sect_xueyi', spawn: { x: 0, y: 520 }, label: '血衣阁山门' },
            // 南侧 1 山门
            { id: 'hub_to_liangyi', pos: { x: 0, y: -500 }, to: 'sect_liangyi', spawn: { x: 0, y: 520 }, label: '两仪门山门' },
        ],
        spawn: { x: 0, y: 700 },
        bgTone: 0.3,
        flagOnEnter: 'arrive_hub',
    },

    // ============ 主城 ============
    town: {
        id: 'town', name: '主城',
        halfW: 1000, halfH: 750,
        ground: 'town',
        npcs: [
            // 城门守卫（路边，避开城门传送点 (0,-700)）
            { npcId: 'chengmenwei', pos: { x: -160, y: -640 }, facing: 1 },
            // 招募广场（环列）
            { npcId: 'xietinglei', pos: { x: 0, y: 260 }, facing: -1 },
            { npcId: 'tietu', pos: { x: -260, y: 200 }, facing: 1 },
            { npcId: 'suwanqing', pos: { x: 260, y: 200 }, facing: -1 },
            { npcId: 'yanbeihui', pos: { x: -420, y: 100 }, facing: 1 },
            { npcId: 'zhaopolu', pos: { x: 420, y: 100 }, facing: -1 },
            { npcId: 'yangfuyou', pos: { x: -260, y: -20 }, facing: 1 },
            { npcId: 'chenxuanyi', pos: { x: 260, y: -20 }, facing: -1 },
            // 市集
            { npcId: 'shuoshuren', pos: { x: 0, y: -160 }, facing: 1 },
            { npcId: 'kezhanzhanggui', pos: { x: -500, y: -240 }, facing: 1 },
            { npcId: 'zahuolang', pos: { x: 500, y: -240 }, facing: -1 },
            // 江湖散人区（东西两侧）
            { npcId: 'moxuzi', pos: { x: -700, y: 300 }, facing: 1 },
            { npcId: 'liqingshan', pos: { x: 700, y: 300 }, facing: -1 },
            { npcId: 'zuiqigai', pos: { x: -800, y: -100 }, facing: 1 },
            { npcId: 'emeishitai', pos: { x: 800, y: -100 }, facing: -1 },
            { npcId: 'chongxu', pos: { x: -650, y: -420 }, facing: 1 },
            { npcId: 'xueying', pos: { x: 650, y: -420 }, facing: -1 },
            { npcId: 'huashanjiansheng', pos: { x: -320, y: 480 }, facing: 1 },
            { npcId: 'moyuan', pos: { x: 320, y: 480 }, facing: -1 },
            // 问道塔（大地图边界处·东北角）
            { npcId: 'tower_gate', pos: { x: 880, y: 620 }, facing: -1 },
        ],
        teleports: [
            { id: 'town_to_hub', pos: { x: 0, y: -700 }, to: 'hub', spawn: { x: 0, y: -800 }, label: '城门' },
        ],
        spawn: { x: 0, y: 560 },
        bgTone: 0.45,
        flagOnEnter: 'arrive_town',
    },

    // ============ 七门派庭院（统一模板） ============
    sect_jianzong: {
        id: 'sect_jianzong', name: '谪仙剑宗',
        halfW: 800, halfH: 600,
        ground: 'sect',
        npcs: [
            { npcId: 'gusiqing', pos: { x: 0, y: 280 }, facing: -1 },
            { npcId: 'xietinglei', pos: { x: 0, y: 40 }, facing: 1 },
            { npcId: 'jianzong_d1', pos: { x: -260, y: -140 }, facing: 1 },
            { npcId: 'jianzong_d2', pos: { x: 260, y: -140 }, facing: -1 },
        ],
        teleports: [
            { id: 'sect_jianzong_to_hub', pos: { x: 0, y: -560 }, to: 'hub', spawn: { x: -750, y: 550 }, label: '山门' },
        ],
        spawn: { x: 0, y: 520 },
        bgTone: 0.35,
        flagOnEnter: 'enter_sect',
    },
    sect_badaomen: {
        id: 'sect_badaomen', name: '霸刀门',
        halfW: 800, halfH: 600,
        ground: 'sect',
        npcs: [
            { npcId: 'daokuangren', pos: { x: 0, y: 280 }, facing: -1 },
            { npcId: 'tietu', pos: { x: 0, y: 40 }, facing: 1 },
            { npcId: 'badaomen_d1', pos: { x: -260, y: -140 }, facing: 1 },
            { npcId: 'badaomen_d2', pos: { x: 260, y: -140 }, facing: -1 },
        ],
        teleports: [
            { id: 'sect_badaomen_to_hub', pos: { x: 0, y: -560 }, to: 'hub', spawn: { x: -1050, y: 150 }, label: '山门' },
        ],
        spawn: { x: 0, y: 520 },
        bgTone: 0.55,
        flagOnEnter: 'enter_sect',
    },
    sect_liuyinge: {
        id: 'sect_liuyinge', name: '流音阁',
        halfW: 800, halfH: 600,
        ground: 'sect',
        npcs: [
            { npcId: 'shenxiang', pos: { x: 0, y: 280 }, facing: -1 },
            { npcId: 'suwanqing', pos: { x: 0, y: 40 }, facing: 1 },
            { npcId: 'liuyinge_d1', pos: { x: -260, y: -140 }, facing: 1 },
            { npcId: 'liuyinge_d2', pos: { x: 260, y: -140 }, facing: -1 },
        ],
        teleports: [
            { id: 'sect_liuyinge_to_hub', pos: { x: 0, y: -560 }, to: 'hub', spawn: { x: -800, y: -350 }, label: '山门' },
        ],
        spawn: { x: 0, y: 520 },
        bgTone: 0.4,
        flagOnEnter: 'enter_sect',
    },
    sect_jinghong: {
        id: 'sect_jinghong', name: '惊鸿山庄',
        halfW: 800, halfH: 600,
        ground: 'sect',
        npcs: [
            { npcId: 'yeliuhong', pos: { x: 0, y: 280 }, facing: -1 },
            { npcId: 'yanbeihui', pos: { x: 0, y: 40 }, facing: 1 },
            { npcId: 'jinghong_d1', pos: { x: -260, y: -140 }, facing: 1 },
            { npcId: 'jinghong_d2', pos: { x: 260, y: -140 }, facing: -1 },
        ],
        teleports: [
            { id: 'sect_jinghong_to_hub', pos: { x: 0, y: -560 }, to: 'hub', spawn: { x: 750, y: 550 }, label: '山门' },
        ],
        spawn: { x: 0, y: 520 },
        bgTone: 0.4,
        flagOnEnter: 'enter_sect',
    },
    sect_liehun: {
        id: 'sect_liehun', name: '烈魂枪门',
        halfW: 800, halfH: 600,
        ground: 'sect',
        npcs: [
            { npcId: 'yueshuji', pos: { x: 0, y: 280 }, facing: -1 },
            { npcId: 'zhaopolu', pos: { x: 0, y: 40 }, facing: 1 },
            { npcId: 'liehun_d1', pos: { x: -260, y: -140 }, facing: 1 },
            { npcId: 'liehun_d2', pos: { x: 260, y: -140 }, facing: -1 },
        ],
        teleports: [
            { id: 'sect_liehun_to_hub', pos: { x: 0, y: -560 }, to: 'hub', spawn: { x: 1050, y: 150 }, label: '山门' },
        ],
        spawn: { x: 0, y: 520 },
        bgTone: 0.5,
        flagOnEnter: 'enter_sect',
    },
    sect_xueyi: {
        id: 'sect_xueyi', name: '血衣阁',
        halfW: 800, halfH: 600,
        ground: 'sect',
        npcs: [
            { npcId: 'gongsunqing', pos: { x: 0, y: 280 }, facing: -1 },
            { npcId: 'yangfuyou', pos: { x: 0, y: 40 }, facing: 1 },
            { npcId: 'xueyi_d1', pos: { x: -260, y: -140 }, facing: 1 },
            { npcId: 'xueyi_d2', pos: { x: 260, y: -140 }, facing: -1 },
        ],
        teleports: [
            { id: 'sect_xueyi_to_hub', pos: { x: 0, y: -560 }, to: 'hub', spawn: { x: 800, y: -350 }, label: '山门' },
        ],
        spawn: { x: 0, y: 520 },
        bgTone: 0.6,
        flagOnEnter: 'enter_sect',
    },
    sect_liangyi: {
        id: 'sect_liangyi', name: '两仪门',
        halfW: 800, halfH: 600,
        ground: 'sect',
        npcs: [
            { npcId: 'tianyundaozhang', pos: { x: 0, y: 280 }, facing: -1 },
            { npcId: 'chenxuanyi', pos: { x: 0, y: 40 }, facing: 1 },
            { npcId: 'liangyi_d1', pos: { x: -260, y: -140 }, facing: 1 },
            { npcId: 'liangyi_d2', pos: { x: 260, y: -140 }, facing: -1 },
        ],
        teleports: [
            { id: 'sect_liangyi_to_hub', pos: { x: 0, y: -560 }, to: 'hub', spawn: { x: 0, y: -500 }, label: '山门' },
        ],
        spawn: { x: 0, y: 520 },
        bgTone: 0.3,
        flagOnEnter: 'enter_sect',
    },
};

export function getRegionById(id: string): RegionDef | undefined {
    return REGIONS[id];
}
