# 《墨江湖》第一章开发规划（数据表先行 + 分工排期）

> 配套文档：设计定稿见 `docs/GDD.md` §13。本文档为第一章开发的执行规划——数据表即 P0 落地稿，直接按表实现。

## 0. 目标与原则

- 目标：第一章三幕完整可玩（20~25 分钟），在现有回合制战斗框架上扩展，不推翻既有系统。
- 原则：
  1. **数据表先行**——本文档 §2 即为 P0 阶段落地数据；
  2. **数值铁律不破**——CD 越高、单回合均伤越高（1.0 → 1.4 → 1.6 → 1.95 档位）；
  3. **旧存档兼容**——所有存档字段扩展均为可选/默认值合并。

## 1. 阶段排期总表

| 阶段 | 内容 | 依赖 | 估计 | 验收标准 |
|---|---|---|---|---|
| P0 数据层 | 类型/武学/武器/门派/任务/塔层/NPC 数据 | — | 0.5~1 天 | 构建通过；图鉴出现伞/拳；无回归 |
| P1 战斗扩展 | 中毒 DOT、武器速度/闪避修正、新特效 | P0 | 0.5~1 天 | 毒 2 回合 DOT 生效；拳速/闪生效；5 场回归 |
| P2 地图区域系统 | 区域数据/传送节点/地面/边界钳制 | —（可并行） | 1.5~2 天 | 10 区域可步行/传送；NPC 归位正确 |
| P3 NPC 与拜师流程 | 对话选项/考核战/拜师/切磋教学 | P2 | 1.5~2 天 | 7 派可完整拜师；未选门派可闲逛寒暄 |
| P4 UI 与美术 | 任务日志/门派页/图鉴扩展/行囊物品/火柴人伞拳 | P0、P2 | 1~1.5 天 | Q 清单打勾；图鉴 7 武器；伞/拳造型 |
| P5 流程整合 | 序章 gating/教学/三钩子/存档迁移 | P3、P4 | 1~1.5 天 | 新档 20~25 分钟三幕；旧档不崩 |
| P6 测试调优 | 平衡脚本验证/难度曲线/时长实测/润色 | P5 | 1~2 天 | 伞/拳 CD 曲线递增；时长达标 |

**并行关系**：P0 → P1 串行；P2 独立可与 P1 并行；P3 依赖 P2；P4 依赖 P0/P2（可与 P3 并行）；P5 收拢 P3/P4；P6 收尾。

**里程碑**：
- M1 = P0+P1：伞/拳可进战斗（新武器战斗闭环）
- M2 = P2+P3：七派可拜师（拜师流程闭环）
- M3 = P4+P5：完整三幕可玩（20~25 分钟）
- M4 = P6：发布候选（数值/时长达标）

## 2. 数据表先行（P0 落地稿）

### 2.1 武器表（新增 2）

| id | name | type | atk | range | spdMod | dodgeMod | desc | source |
|---|---|---|---|---|---|---|---|---|
| umbrella | 铁骨伞 | Umbrella | 9 | 150 | — | — | 铁骨为骨，油纸为面；伞开可御，伞合为刃。 | 血衣阁掌门授予 |
| fist | 两仪拳套 | Fist | 5 | 100 | +40 | +0.05 | 赤手缠丝，阴阳相济；拳出无形，身法如风。 | 两仪门掌门授予 |

**类型扩展**：`WeaponDef` 增加可选 `spdMod?`/`dodgeMod?`（默认 0）；`StatCalculator.compute` 并入 `spd`（基础 220）与 `dodge`（上限 0.6）。
**必改点**：`DamageFormula.WEAPON_NAMES`（Record<WeaponType,string> 需补 伞/拳，否则编译报错）、CodexPanel 武器过滤列表（5→7）。

### 2.2 武学表（新增 6）

**伞（血衣阁）**：

| id | name | CD | mult×hit | mp | range | fx | effect | source |
|---|---|---|---|---|---|---|---|---|
| yusanren | 伞刃 | 0 | 1.0×1 | 0 | 150 | spin | — | 血衣阁拜师 |
| sanyingsandie | 伞影三叠 | 1 | 1.4×2 | 15 | 155 | spin | — | 血衣阁拜师 |
| xueyupiaoling | 血雨飘零 | 2 | 2.0×2 | 28 | 160 | spin | poison 0.12×2回合 | 塔 6 层 |
| mihunshanyan | 迷魂伞烟 | 3 | 1.9×3 | 45 | 170 | spin | stun 1 + poison 0.08 | 塔 11 层 |

**拳（两仪门）**：

| id | name | CD | mult×hit | mp | range | fx | effect | source |
|---|---|---|---|---|---|---|---|---|
| chongquan | 冲拳 | 0 | 1.0×1 | 0 | 100 | punch | — | 两仪门拜师 |
| taijichansi | 太极缠丝 | 1 | 1.3×2 | 15 | 105 | punch | slow 0.25 | 两仪门拜师 |
| sixiangbengquan | 四象崩拳 | 2 | 1.2×4 | 28 | 110 | punch | — | 塔 9 层 |
| yinyangheji | 阴阳合击 | 3 | 2.2×3 | 45 | 115 | punch | trueStrike + armorBreak 0.15 | 塔 13 层 |

**类型扩展**：`SkillDef` 增加 `poison?: number`（每回合造成 攻击方 atk×poison 伤害，持续 2 回合，施放时固化伤害值）；fx 联合类型 + `'spin' | 'punch'`。

**平衡核算**（按施放周期总伤 = mult×hit + 周期内毒伤）：
- 伞线：CD1 2.8 → CD2 4.0+0.24 → CD3 5.7+0.16+眩晕；均伤 1.90 → 2.08 → 2.22 **递增 ✓**
- 拳线：CD1 2.6 → CD2 4.8 → CD3 6.6(+必中+破甲)；均伤 1.80 → 2.27 → 2.40 **递增 ✓**
- 对照剑线 1.90 → 2.27 → 2.70：伞线以控制/毒补偿略低均伤，拳线以必中/破甲补偿，P6 实测微调。

### 2.3 七派武学分配与获取

| 门派 | 武器 | 基础（普攻） | CD1（拜师礼） | CD2 | CD3 | 专属 |
|---|---|---|---|---|---|---|
| 谪仙剑宗 | 剑 | 基础剑式 | 落英剑法 | 太虚剑意（塔19） | 破式九剑（塔10） | 天行剑诀（塔20） |
| 霸刀门 | 刀 | 基础刀法 | 断水流 | 破军刀法（醉乞丐） | 狂刀决（血影老祖） | 无双刀法（塔17） |
| 流音阁 | 琴 | 基础琴音 | 清心曲 | 高山流水（静慧师太） | 广陵散（塔14） | — |
| 惊鸿山庄 | 弓 | 基础箭术 | 追风箭 | 连珠箭（塔7） | 落日神箭（血影传授） | — |
| 烈魂枪门 | 枪 | 基础枪法 | 盘龙枪法 | 破阵枪诀（塔16） | 百鸟枪决（塔18/风清客） | — |
| 血衣阁 | 伞 | 伞刃 | 伞影三叠 | 血雨飘零（塔6） | 迷魂伞烟（塔11） | — |
| 两仪门 | 拳 | 冲拳 | 太极缠丝 | 四象崩拳（塔9） | 阴阳合击（塔13） | — |

### 2.4 问道塔掉落重排（4 处替换）

| 层 | 现掉落 | 改为 | 说明 |
|---|---|---|---|
| 6 | 追风箭 | 血雨飘零 | 追风箭改由惊鸿山庄拜师授予 |
| 9 | 盘龙枪法 | 四象崩拳 | 盘龙枪法改由烈魂枪门拜师授予 |
| 11 | 清心曲 | 迷魂伞烟 | 清心曲改由流音阁拜师授予 |
| 13 | 断水流 | 阴阳合击 | 断水流改由霸刀门拜师授予 |

其余层掉落不变（龟息功/草上飞/踏波行/连珠/破式/广陵散/紫霄真气/破阵/无双/太虚/百鸟/天行等维持现状）。守卫武器/技能先不动，P6 再按新武器入塔曲线调整。

### 2.5 门派表（新文件 `Sects.ts`）

| sectId | 门派 | 掌门 | 武器 | 招募者 | 称号 | 庭院区域 |
|---|---|---|---|---|---|---|
| jianzong | 谪仙剑宗 | 顾思卿 | sword | 谢听雷 | 谪仙弟子 | sect_jianzong |
| badaomen | 霸刀门 | 刀狂人 | blade | 铁屠 | 霸刀弟子 | sect_badaomen |
| liuyinge | 流音阁 | 沈相 | guqin | 苏婉清 | 流音弟子 | sect_liuyinge |
| jinghongshanzhuang | 惊鸿山庄 | 叶流鸿 | bow | 燕北回 | 惊鸿弟子 | sect_jinghong |
| liehunqiangmen | 烈魂枪门 | 岳叔疾 | spear | 赵破虏 | 烈魂弟子 | sect_liehun |
| xueyige | 血衣阁 | 公孙晴 | umbrella | 杨抚佑 | 血衣弟子 | sect_xueyi |
| liangyimen | 两仪门 | 天韵道长 | fist | 陈玄一 | 两仪弟子 | sect_liangyi |

`SectDef`：{id, name, weapon, masterId, recruiterId, title, regionId}。

### 2.6 NPC 总表（~34 新增 + 旧 8 归位）

**村庄（序章区域）**：
| id | 名 | 角色 | 要点 |
|---|---|---|---|
| shenmiren | 沈觅人 | 核心剧情 | 三艺传授/赠玉佩/切磋教学/下山指引/终局无字信 |
| cuntong | 村童 | 气氛 | 1~2 句台词 |
| muzhuang | 练功木桩 | 功能节点 | 练习交互（普攻教学） |

**主城**：
| id | 名 | 角色 | 要点 |
|---|---|---|---|
| xietinglei | 谢听雷 | 招募者·剑 | 门派介绍/传送山门 |
| tietu | 铁屠 | 招募者·刀 | 同上 |
| suwanqing | 苏婉清 | 招募者·琴 | 同上（考核只守不攻） |
| yanbeihui | 燕北回 | 招募者·弓 | 同上（将门暗线半句） |
| zhaopolu | 赵破虏 | 招募者·枪 | 同上（将门暗线半句） |
| yangfuyou | 杨抚佑 | 招募者·伞 | 同上（魔教悬赏半句） |
| chenxuanyi | 陈玄一 | 招募者·拳 | 同上 |
| shuoshuren | 说书人 | 钩子 | 问道塔异动/魔教踪迹/七派招募三传闻 |
| kezhanzhanggui | 客栈掌柜 | 气氛 | 存档提示 |
| zahuolang | 杂货郎 | 气氛 | 1~2 句 |
| chengmenwei | 城门守卫 | 气氛 | 1~2 句 |
| （既有） | 问道塔入口 | 功能 | 现有 TOWER_GATE 归位 |

**门派庭院（每派 3，共 21）**：掌门 7（gusiqing 顾思卿 / daokuangren 刀狂人 / shenxiang 沈相 / yeliuhong 叶流鸿 / yueshuji 岳叔疾 / gongsunqing 公孙晴 / tianyundaozhang 天韵道长）+ 首席弟子（复用招募者，双地点：主城 + 门内）+ 弟子×2（占位名「剑宗弟子·甲/乙」式，P3 前可批量命名）。

**旧 8 NPC 归位**：墨虚子/李青山/醉乞丐/静慧师太/冲虚道长/血影老祖/风清客/墨渊老祖 → 主城周边散点，切磋/传授/掉落功能全部保留（江湖闲游内容）。

**类型扩展**：`NpcDef` 增加 `role?: 'master'|'recruiter'|'disciple'|'villager'|'townsfolk'`、`sectId?: string`。

### 2.7 任务日志表（新文件 `Quests.ts`，Q 键清单式）

**序章**：
| id | 标题 | 目标 | flag |
|---|---|---|---|
| q1 | 异世初醒 | 走出木屋 | wake_up |
| q2 | 聆听教诲 | 与沈觅人交谈 | shen_talk |
| q3 | 初学武艺 | 习得吐纳诀/健步功/基础剑式 | learn_3 |
| q4 | 木桩试炼 | 与练功木桩互动 | stump_done |
| q5 | 临别赠玉 | 收下沈觅人的玉佩 | get_pendant |
| q6 | 下山 | 离开小村 | leave_village |

**下山**：
| id | 标题 | 目标 | flag |
|---|---|---|---|
| q7 | 初入江湖 | 抵达江湖中枢 | arrive_hub |
| q8 | 主城见闻 | 进入主城 | arrive_town |
| q9 | 切磋之约 | 与沈觅人切磋一场 | spar_shen |
| q10 | 江湖三闻 | 打听问道塔异动/魔教踪迹/七派招募 | rumors_done |
| q11 | 择师 | 与任意一位招募者交谈 | met_recruiter |

**拜师**：
| id | 标题 | 目标 | flag |
|---|---|---|---|
| q12 | 入山门 | 前往所选门派庭院 | enter_sect |
| q13 | 掌门考核 | 胜过首席弟子 | trial_win |
| q14 | 授艺入门 | 获得门派武器与拜师礼 | sect_joined |
| q15 | 无字信 | 拆开沈觅人的无字信 | letter_opened |
| q16 | 玉佩印记 | 掌门提及玉佩印记 | pendant_mark |

`QuestDef`：{id, title, desc, targets: [{text, flag}], next?}；状态机 locked / active / done（前置完成自动激活，清单式打勾）。

### 2.8 存档与类型扩展

`PlayerState` 新增：
```ts
flags: Record<string, boolean>;  // 剧情/任务进度标记
questItems: string[];            // 剧情物品（玉佩/无字信）
sectId?: string;                 // 已入门派
sectTitle?: string;              // 门派称号
```
`createDefaultState` 补默认值（`flags: {}, questItems: []`）；`load` 的默认值合并天然兼容旧档，无需强制迁移。

## 3. 各阶段触达文件清单（分工明细）

| 阶段 | 文件 | 任务 |
|---|---|---|
| P0 | GameTypes.ts | WeaponType+伞/拳；SkillDef+poison；WeaponDef+spdMod/dodgeMod；NpcDef+role/sectId；PlayerState+flags/questItems/sectId/sectTitle；+QuestDef/SectDef |
| P0 | MartialArts.ts | +6 武学（伞/拳各 1 基础 + 3 进阶） |
| P0 | Weapons.ts | +2 武器 |
| P0 | Sects.ts（新） | 7 门派表 |
| P0 | Quests.ts（新） | 16 任务表 |
| P0 | Tower.ts | 4 处掉落替换（6/9/11/13 层） |
| P0 | Npcs.ts | +34 NPC；旧 8 归位坐标 |
| P0 | DamageFormula.ts | WEAPON_NAMES 补 伞/拳 |
| P1 | StatCalculator.ts | 武器 spdMod/dodgeMod 并入 |
| P1 | BattleEntity.ts | poison 状态（poisonDmg/poisonTimer）+ 回合末结算 |
| P1 | CombatManager.ts / DamageFormula.ts | poison 透传与飘字 |
| P1 | InkEffects.ts | fx 'spin'（旋伞弧）/ 'punch'（拳风线） |
| P2 | RegionDef（新数据） | 10 区域定义（边界/地面样式/NPC 归属/传送节点） |
| P2 | WorldManager.ts | 区域制：按区域生成地面与 NPC、传送切换、边界钳制 |
| P2 | CameraFollow.ts / GroundPainter.ts | 区域边界跟随与地面样式 |
| P3 | NpcDialog.ts | 选项扩展（招募：介绍门派/前往山门；掌门：考核/寒暄） |
| P3 | WorldManager.ts / GameManager.ts | 考核战模板、拜师授艺流程、任务 flag 上报 |
| P3 | EnemyAI.ts | 只守不攻参数（苏婉清考核） |
| P3 | BattleArena.ts | 切磋教学引导（首战：防御/技能说明） |
| P4 | QuestPanel.ts（新） | Q 键清单式任务日志 |
| P4 | MartialPanel.ts | 新增「门派」页（门派/称号/掌门/武学一览） |
| P4 | CodexPanel.ts | 武器过滤 +伞/拳 |
| P4 | HudPanel.ts | 提示更新（Q 任务）；武器标签自动适配 |
| P4 | 行囊 | 新增「物品」区（玉佩/无字信） |
| P4 | Stickman.ts | 伞（持伞/开伞造型）、拳（握拳/拳套）绘制 |
| P5 | WorldManager.ts | 序章 gating（区域解锁顺序）、教学引导、三钩子 |
| P5 | SaveSystem.ts | 默认值合并 + 迁移验证 |
| P6 | 平衡脚本 + 数值微调 | 伞/拳 CD 曲线、塔难度、时长实测 |

## 4. 风险与待办

- **弟子命名**：14 名弟子占位名，P3 前可定（若需玩家设定，与招募者同流程）。
- **台词润色**：招募台词/掌门考核开场白为起草稿，P3 落库后统一润色。
- **时长超标**：若实测 >25 分钟，优先削减闲聊台词与庭院路径长度。
- **旧档兼容**：用既有测试档验证迁移（新字段默认值、无崩溃）。
- **塔难度**：新武器入塔后 6/9/11/13 层守卫曲线需实测（P6）。
