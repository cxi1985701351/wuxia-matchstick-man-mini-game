import { QuestDef } from './GameTypes.ts';

/**
 * 墨江湖 - 第一章任务日志配置表（Q 键，清单式）
 * 目标达成时由流程代码写入 PlayerState.flags[flag] = true。
 */
export const QUESTS: QuestDef[] = [
    // ===== 序章·异世 =====
    {
        id: 'q1', title: '异世初醒', desc: '从陌生的小木屋中醒来。',
        targets: [{ text: '走出木屋', flag: 'wake_up' }],
        next: 'q2',
    },
    {
        id: 'q2', title: '聆听教诲', desc: '院中那位黑衣人在等你。',
        targets: [{ text: '与沈觅人交谈', flag: 'shen_talk' }],
        next: 'q3',
    },
    {
        id: 'q3', title: '初学武艺', desc: '习得吐纳诀、健步功与基础剑式。',
        targets: [{ text: '习得吐纳诀/健步功/基础剑式', flag: 'learn_3' }],
        next: 'q4',
    },
    {
        id: 'q4', title: '木桩试炼', desc: '村口木桩，练习出手。',
        targets: [{ text: '与练功木桩互动', flag: 'stump_done' }],
        next: 'q5',
    },
    {
        id: 'q5', title: '临别赠玉', desc: '沈觅人赠你一枚玉佩。',
        targets: [{ text: '收下玉佩', flag: 'get_pendant' }],
        next: 'q6',
    },
    {
        id: 'q6', title: '下山', desc: '辞别小村，踏入江湖。',
        targets: [{ text: '离开小村', flag: 'leave_village' }],
        next: 'q7',
    },

    // ===== 第一章·下山 =====
    {
        id: 'q7', title: '初入江湖', desc: '山道尽头，是一片辽阔天地。',
        targets: [{ text: '抵达江湖中枢', flag: 'arrive_hub' }],
        next: 'q8',
    },
    {
        id: 'q8', title: '主城见闻', desc: '江湖中人汇聚之地。',
        targets: [{ text: '进入主城', flag: 'arrive_town' }],
        next: 'q9',
    },
    {
        id: 'q9', title: '切磋之约', desc: '沈觅人说要考考你的身手。',
        targets: [{ text: '与沈觅人切磋一场', flag: 'spar_shen' }],
        next: 'q10',
    },
    {
        id: 'q10', title: '江湖三闻', desc: '市井传闻，往往藏着真相。',
        targets: [{ text: '打听问道塔异动/魔教踪迹/七派招募', flag: 'rumors_done' }],
        next: 'q11',
    },
    {
        id: 'q11', title: '择师', desc: '七派皆有招募者在主城等候。',
        targets: [{ text: '与任意一位招募者交谈', flag: 'met_recruiter' }],
        next: 'q12',
    },

    // ===== 第一章·拜师 =====
    {
        id: 'q12', title: '入山门', desc: '前往所选门派的庭院。',
        targets: [{ text: '前往所选门派庭院', flag: 'enter_sect' }],
        next: 'q13',
    },
    {
        id: 'q13', title: '掌门考核', desc: '掌门命你与首席弟子切磋。',
        targets: [{ text: '胜过首席弟子', flag: 'trial_win' }],
        next: 'q14',
    },
    {
        id: 'q14', title: '授艺入门', desc: '通过考核，拜入山门。',
        targets: [{ text: '获得门派武器与拜师礼', flag: 'sect_joined' }],
        next: 'q15',
    },
    {
        id: 'q15', title: '无字信', desc: '沈觅人的信，不着一字。',
        targets: [{ text: '拆开沈觅人的无字信', flag: 'letter_opened' }],
        next: 'q16',
    },
    {
        id: 'q16', title: '玉佩印记', desc: '门派卷宗里，竟有玉佩印记。',
        targets: [{ text: '掌门提及玉佩印记', flag: 'pendant_mark' }],
    },
];

export function getQuestById(id: string): QuestDef | undefined {
    return QUESTS.find((q) => q.id === id);
}
