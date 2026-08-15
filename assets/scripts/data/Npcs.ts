import { NpcDef, WeaponType } from './GameTypes.ts';

/**
 * 墨江湖 - 地图 NPC 配置表
 */
export const NPCS: Record<string, NpcDef> = {
    moxuzi: {
        id: 'moxuzi', name: '墨虚子', title: '青山观主',
        level: 1, pos: { x: 0, y: -120 },
        dialog: [
            '老夫墨虚子，观中修行三百载。',
            '道友初入江湖，可先习吐纳诀，养气筑基。',
            '江湖凶险，若遇强敌，点到为止便是。',
        ],
        canFight: true, xp: 10,
        teachMartial: 'shaoyanggong',
        weapon: WeaponType.Sword, skillIds: ['jichujianshi'],
        inkTone: 0.35,
    },
    liqingshan: {
        id: 'liqingshan', name: '李青山', title: '铁剑门弟子',
        level: 3, pos: { x: 280, y: -40 },
        dialog: [
            '在下铁剑门李青山，练剑十年。',
            '你若胜我，这落英剑法残页便归你。',
            '剑者，心正则剑正！',
        ],
        canFight: true, xp: 30,
        dropMartial: 'luoyingjianfa', teachMartial: 'yanxingshu',
        weapon: WeaponType.Sword, skillIds: ['jichujianshi', 'luoyingjianfa'],
        inkTone: 0.5,
    },
    zuiqigai: {
        id: 'zuiqigai', name: '醉乞丐', title: '丐帮九袋长老',
        level: 6, pos: { x: -300, y: 60 },
        dialog: [
            '嗝……小友可要讨杯酒喝？',
            '我这一身醉拳刀法，胜我者可得。',
            '这把屠龙刀，也一并赠你有缘人。',
        ],
        canFight: true, xp: 60,
        dropMartial: 'kuangdaojue', dropWeapon: 'blade', teachMartial: 'tiyunzong',
        weapon: WeaponType.Blade, skillIds: ['jichudao', 'pojundao'],
        inkTone: 0.55,
    },
    emeishitai: {
        id: 'emeishitai', name: '静慧师太', title: '峨眉掌门',
        level: 9, pos: { x: 520, y: 140 },
        dialog: [
            '峨眉山门清净，施主远道而来。',
            '我有一门玄女诀，可传有缘。',
            '琴音可清心，高山流水曲谱，胜我可得。',
        ],
        canFight: true, xp: 90,
        teachMartial: 'xuannvjue', dropMartial: 'gaoshanliushui', dropWeapon: 'guqin',
        weapon: WeaponType.Guqin, skillIds: ['jichuqinyin', 'gaoshanliushui'],
        inkTone: 0.4,
    },
    chongxu: {
        id: 'chongxu', name: '冲虚道长', title: '武当掌门',
        level: 12, pos: { x: -560, y: -160 },
        dialog: [
            '武当冲虚，见过道友。',
            '紫霞神功乃我武当镇派之宝。',
            '道友既通音律，这焦尾琴便赠与你。',
        ],
        canFight: true, xp: 120,
        teachMartial: 'zixiashengong', dropWeapon: 'guqin',
        weapon: WeaponType.Sword, skillIds: ['jichujianshi', 'poshijiujian'],
        inkTone: 0.45,
    },
    xueying: {
        id: 'xueying', name: '血影老祖', title: '魔教护法',
        level: 15, pos: { x: 680, y: -120 },
        dialog: [
            '桀桀……竟敢寻到本座门前。',
            '此弓惊鸿，配我落日神箭，天下无双。',
            '若胜我，神箭与弓都归你！',
        ],
        canFight: true, xp: 150,
        teachMartial: 'luorishenjian', dropWeapon: 'bow',
        weapon: WeaponType.Bow, skillIds: ['jichujianshu', 'zhuifengjian', 'luorishenjian'],
        inkTone: 0.7,
    },
    huashanjiansheng: {
        id: 'huashanjiansheng', name: '风清客', title: '华山剑圣',
        level: 18, pos: { x: -820, y: 180 },
        dialog: [
            '剑道无穷，唯快不破。',
            '破式九剑，破尽天下招式。',
            '这杆玄铁枪，赠予枪法有缘人。',
        ],
        canFight: true, xp: 180,
        teachMartial: 'poshijiujian', dropWeapon: 'spear', dropMartial: 'bainiaoqiangjue',
        weapon: WeaponType.Sword, skillIds: ['jichujianshi', 'luoyingjianfa', 'poshijiujian'],
        inkTone: 0.5,
    },
    moyuan: {
        id: 'moyuan', name: '墨渊老祖', title: '隐世大能',
        level: 22, pos: { x: 60, y: 300 },
        dialog: [
            '小友能走到此，也算有缘。',
            '纯阳功与缩地成寸，尽可传你。',
            '此界之外，还有问道塔百层……',
        ],
        canFight: true, xp: 220,
        teachMartial: 'chunyangong', dropMartial: 'suodichengcun',
        weapon: WeaponType.Spear, skillIds: ['jichuqiang', 'panlongqiang', 'bainiaoqiangjue'],
        inkTone: 0.3,
    },
};

/** 塔入口 NPC（功能节点） */
export const TOWER_GATE: NpcDef = {
    id: 'tower_gate', name: '问道塔', title: '试炼之地',
    level: 1, pos: { x: 0, y: -320 },
    dialog: ['问道塔，共二十层，层层凶险。', '攀登越高，奖励越丰厚。', '道友可敢一试？'],
    canFight: false, xp: 0,
    weapon: WeaponType.Sword, skillIds: [],
    inkTone: 0.6,
};
