import { SectDef, WeaponType } from './GameTypes.ts';

/**
 * 墨江湖 - 门派配置表（第一章）
 * 每派：掌门 + 首席弟子（主城招募者，双地点站位）+ 庭院区域 + 拜师礼（CD1 武学）
 */
export const SECTS: Record<string, SectDef> = {
    jianzong: {
        id: 'jianzong', name: '谪仙剑宗', weapon: WeaponType.Sword,
        masterId: 'gusiqing', recruiterId: 'xietinglei',
        title: '谪仙弟子', regionId: 'sect_jianzong',
        giftMartial: 'luoyingjianfa',
    },
    badaomen: {
        id: 'badaomen', name: '霸刀门', weapon: WeaponType.Blade,
        masterId: 'daokuangren', recruiterId: 'tietu',
        title: '霸刀弟子', regionId: 'sect_badaomen',
        giftMartial: 'duanshuiliu',
    },
    liuyinge: {
        id: 'liuyinge', name: '流音阁', weapon: WeaponType.Guqin,
        masterId: 'shenxiang', recruiterId: 'suwanqing',
        title: '流音弟子', regionId: 'sect_liuyinge',
        giftMartial: 'qingxinqu',
    },
    jinghongshanzhuang: {
        id: 'jinghongshanzhuang', name: '惊鸿山庄', weapon: WeaponType.Bow,
        masterId: 'yeliuhong', recruiterId: 'yanbeihui',
        title: '惊鸿弟子', regionId: 'sect_jinghong',
        giftMartial: 'zhuifengjian',
    },
    liehunqiangmen: {
        id: 'liehunqiangmen', name: '烈魂枪门', weapon: WeaponType.Spear,
        masterId: 'yueshuji', recruiterId: 'zhaopolu',
        title: '烈魂弟子', regionId: 'sect_liehun',
        giftMartial: 'panlongqiang',
    },
    xueyige: {
        id: 'xueyige', name: '血衣阁', weapon: WeaponType.Umbrella,
        masterId: 'gongsunqing', recruiterId: 'yangfuyou',
        title: '血衣弟子', regionId: 'sect_xueyi',
        giftMartial: 'sanyingsandie',
    },
    liangyimen: {
        id: 'liangyimen', name: '两仪门', weapon: WeaponType.Fist,
        masterId: 'tianyundaozhang', recruiterId: 'chenxuanyi',
        title: '两仪弟子', regionId: 'sect_liangyi',
        giftMartial: 'taijichansi',
    },
};

export function getSectById(id: string): SectDef | undefined {
    return SECTS[id];
}
