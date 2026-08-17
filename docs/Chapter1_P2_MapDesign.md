# 《墨江湖》第一章 P2 地图区域系统设计

> 配套：开发规划见 `docs/Chapter1_DevPlan.md`（P2 阶段）、剧情定稿见 `docs/GDD.md` §13。
> 本文件为 P2 的实现设计稿（讨论确认后进入实现）。

## 1. 目标与方案选型

**目标**：10 个中小型区域（村庄/中枢/主城/7 门派庭院）可步行或传送互通；每区域独立边界、地面样式与 NPC 布局；不切场景。

**方案（选定）**：**单 World 容器 + 区域重建**
- 保持现有单世界结构（World 容器 + CameraFollow 反向移动 + UI 相机不动），**不新增场景**。
- 区域切换时：重绘地面（GroundPainter 按样式清空重画）→ 重建该区域 NPC → 玩家瞬移到区域入口 → 镜头 snap → 更新边界钳制参数。
- 每个区域以自身原点 (0,0) 布局，避免巨型世界坐标；程序绘制地面与代码生成 NPC，重建成本可忽略（无资源加载）。

**不做**：多场景加载、预生成全地图、区域渐变过渡（P2 用瞬时切换，P6 可视效果再议）。

## 2. 数据结构设计

### 2.1 RegionDef（新文件 `data/Regions.ts`）

```ts
/** 区域传送点 */
export interface TeleportDef {
    id: string;                      // 传送点标识（区域内外成对对应）
    /** 本区域内节点位置（区域局部坐标） */
    pos: { x: number; y: number };
    /** 目标区域 id */
    to: string;
    /** 到达目标区域后的出生位置（目标区域局部坐标） */
    spawn: { x: number; y: number };
    /** 交互半径（默认 90，与 NPC 一致） */
    radius?: number;
    /** E 键提示文本（如「下山道」「城门」「谪仙剑宗山门」） */
    label: string;
}

/** NPC 实例化（区域内的摆放） */
export interface NpcInstance {
    /** Npcs.ts 中的定义 id */
    npcId: string;
    /** 本区域内位置（覆盖 NpcDef.pos） */
    pos: { x: number; y: number };
    /** 朝向（默认 -1 朝左） */
    facing?: number;
}

export interface RegionDef {
    id: string;                      // 'village' | 'hub' | 'town' | 'sect_jianzong' ...
    name: string;                    // 中文名
    /** 区域半宽/半高（玩家边界钳制 + 镜头钳制） */
    halfW: number;
    halfH: number;
    /** 地面样式键（GroundPainter 4 种） */
    ground: 'village' | 'hub' | 'town' | 'sect';
    /** 本区域 NPC 实例（含旧 8 散人与塔入口） */
    npcs: NpcInstance[];
    /** 本区域传送点 */
    teleports: TeleportDef[];
    /** 玩家首次进入本区域的出生点（区域局部坐标） */
    spawn?: { x: number; y: number };
    /** 远景层色调偏移（InkBackground，可选） */
    bgTone?: number;
    /** 进入本区域时置位的任务 flag（P5 任务日志用，预留接口） */
    flagOnEnter?: string;
}
```

### 2.2 世界容器装配变化

- `WorldManager`：新增 `currentRegion: RegionDef`；`enterRegion(regionId, spawn?)` 统一入口。
- `GroundPainter.drawOnce()` → 重构为 `draw(region: RegionDef)`：`gfx.clear()` + 按 `region.ground` 绘制，取消一次性 `drawn` 标志。
- `CameraFollow`：`mapHalfW/H` 随区域更新，切换后 `snap()`。
- `WorldManager.update`：玩家边界钳制改用 `currentRegion.halfW/H`。
- NPC 生成：删除按 `NPCS` 全量遍历 + region 跳过守卫，改为按 `currentRegion.npcs` 实例化（`NpcDef.pos` 仅作默认，实例 pos 覆盖）。
- 塔入口：`TOWER_GATE` 与塔造型作为 town 区域的实例与功能节点（保留现有交互逻辑：近距离 E 打开塔面板）。

## 3. 10 区域布局总览

### 3.1 传送关系图

```
村庄 village ──(下山道)──▶ 中枢 hub ──(城门)──▶ 主城 town
                            │   ▲
              7 × (山门节点) ─┘   └─(返回节点)── 各庭院
                            ▼
   sect_jianzong / sect_badaomen / sect_liuyinge / sect_jinghong
   / sect_liehun / sect_xueyi / sect_liangyi
```

- 双向传送：每个通道成对定义（A 区节点 → B 区，B 区节点 → A 区）。
- 主城 → 庭院：本章正式路径为「主城 → 中枢 → 山门 → 庭院」；招募者直接传送入门为 P3 功能。
- 初始出生：村庄 (0,0)（木屋位，P5 序章剧情在此展开）。

### 3.2 区域参数表

| 区域 | id | 尺寸(halfW×halfH) | 地面样式 | NPC 数 | 传送点 |
|---|---|---|---|---|---|
| 深山小村 | village | 600×450 | village | 3 | 下山道 |
| 江湖中枢 | hub | 1200×900 | hub | 0 | 下山道/城门/7 山门 |
| 主城 | town | 1000×750 | town | 7 招募者+4 市井+8 散人+塔 | 城门 |
| 谪仙剑宗庭院 | sect_jianzong | 800×600 | sect | 3（掌门+首席+2弟子） | 山门 |
| 霸刀门庭院 | sect_badaomen | 800×600 | sect | 3 | 山门 |
| 流音阁庭院 | sect_liuyinge | 800×600 | sect | 3 | 山门 |
| 惊鸿山庄庭院 | sect_jinghong | 800×600 | sect | 3 | 山门 |
| 烈魂枪门庭院 | sect_liehun | 800×600 | sect | 3 | 山门 |
| 血衣阁庭院 | sect_xueyi | 800×600 | sect | 3 | 山门 |
| 两仪门庭院 | sect_liangyi | 800×600 | sect | 3 | 山门 |

## 4. 各区域详细布局

### 4.1 村庄 village（±600×±450）

| NPC | pos | 说明 |
|---|---|---|
| 沈觅人 shenmiren | (0,-100) | 院中（核心剧情） |
| 村童 cuntong | (260,120) | 气氛 |
| 练功木桩 muzhuang | (-260,-180) | 功能节点（P5 教学） |

- 传送：下山道 (0,-430) → hub spawn (0,800)
- 出生：木屋位 (0,0)（P2 直接出生于此，P5 接醒来剧情）

### 4.2 中枢 hub（±1200×±900）——箱庭通路，无 NPC

| 传送点 | pos | 目标 | 目标 spawn |
|---|---|---|---|
| 下山道入口（北） | (0,850) | village | (0,-380) |
| 主城城门入口（南） | (0,-850) | town | (0,620) |
| 谪仙剑宗山门（西上） | (-750,550) | sect_jianzong | (0,520) |
| 霸刀门山门（西中） | (-1050,150) | sect_badaomen | (0,520) |
| 流音阁山门（西下） | (-800,-350) | sect_liuyinge | (0,520) |
| 惊鸿山庄山门（东上） | (750,550) | sect_jinghong | (0,520) |
| 烈魂枪门山门（东中） | (1050,150) | sect_liehun | (0,520) |
| 血衣阁山门（东下） | (800,-350) | sect_xueyi | (0,520) |
| 两仪门山门（南中） | (0,-500) | sect_liangyi | (0,520) |

- 中央（0,0）画路标石碑（Graphics 静态装饰，不可交互），道路放射连接各节点。

### 4.3 主城 town（±1000×±750）

| NPC | pos | 说明 |
|---|---|---|
| 城门守卫 chengmenwei | (0,-680) | 城门内 |
| 谢听雷 xietinglei | (0,260) | 招募广场（环列） |
| 铁屠 tietu | (-260,200) | 招募广场 |
| 苏婉清 suwanqing | (260,200) | 招募广场 |
| 燕北回 yanbeihui | (-420,100) | 招募广场 |
| 赵破虏 zhaopolu | (420,100) | 招募广场 |
| 杨抚佑 yangfuyou | (-260,-20) | 招募广场 |
| 陈玄一 chenxuanyi | (260,-20) | 招募广场 |
| 说书人 shuoshuren | (0,-160) | 市集 |
| 客栈掌柜 kezhanzhanggui | (-500,-240) | 市集西 |
| 杂货郎 zahuolang | (500,-240) | 市集东 |
| 墨虚子 moxuzi | (-700,300) | 散人区西 |
| 李青山 liqingshan | (700,300) | 散人区东 |
| 醉乞丐 zuiqigai | (-800,-100) | 散人区西 |
| 静慧师太 emeishitai | (800,-100) | 散人区东 |
| 冲虚道长 chongxu | (-650,-420) | 散人区西南 |
| 血影老祖 xueying | (650,-420) | 散人区东南 |
| 风清客 huashanjiansheng | (-320,480) | 散人区西北 |
| 墨渊老祖 moyuan | (320,480) | 散人区东北 |
| 问道塔 TOWER_GATE | (880,620) | **主城边界处（东北角高地，靠近大地图边缘）** |

- 传送：城门 (0,-700) → hub spawn (0,-800)
- 布局分区：城门（南）→ 市集（中）→ 招募广场（中北）→ 问道塔（东北边界角）；散人分居东西两侧。

### 4.4 七门派庭院 sect_*（统一模板 ±800×±600）

| NPC | pos | 说明 |
|---|---|---|
| 掌门（masterId） | (0,280) | 大殿前 |
| 首席弟子（recruiterId 同 id 第二实例） | (0,40) | 前院练武场 |
| 弟子甲 | (-260,-140) | 侧院 |
| 弟子乙 | (260,-140) | 侧院 |

- 传送：山门 (0,-560) → hub（对应山门节点 spawn）
- 地面样式：青石庭院 + 殿台（北侧）+ 花木（两侧）。
- 首席弟子双地点：同一 NpcDef id 在 town 与庭院各实例化一次（RegionDef.npcs 控制，天然支持）。

## 5. 地面样式设计（GroundPainter 4 键）

| 样式 | 视觉要素 |
|---|---|
| village | 宣纸米黄底 + 泥土斑 + 草地笔触 + 小路 + 木桩/篱笆点缀 + 树木 |
| hub | 石板路放射 + 中央圆坛（保留现广场画法）+ 远山墨线 |
| town | 市集方砖 + 十字街道 + 建筑轮廓（简化墨线方块）+ 招募广场石台 |
| sect | 青石方砖 + 大殿台基（北）+ 花木 + 练武场椭圆沙地 |

实现：`GroundPainter.draw(region)` 内 `gfx.clear()` 后按样式分支绘制；底色/纹理/点缀函数复用现有画法（色斑、笔触、树、石、边界晕染）。

## 6. 镜头与边界

- `CameraFollow.mapHalfW/H` = 当前区域 halfW/H；`enterRegion` 后 `snap()`。
- 玩家钳制：`WorldManager.update` 读 `currentRegion.halfW/H`（替换硬编码 1000/650）。
- 镜头平滑跟随逻辑不变（钳制参数随区域走，切换瞬间 snap 无拖影）。

## 7. 交互与流程对接

- **传送交互**：与 NPC 一致——玩家靠近传送点（< radius 90）+ 按 E → `enterRegion(to, spawn)`。E 优先级：NPC > 传送点 > 塔入口（塔入口并入 town 区域后与传送点同级判断）。
- **任务 flag 预留**：`enterRegion` 时若 `region.flagOnEnter` 未置位 → `GameManager.setFlag(flag)`（置位+存档；P5 接任务日志刷新）。P2 阶段数据即填好：village 无、hub→'arrive_hub'、town→'arrive_town'、sect_*→'enter_sect'。
- **传送点提示**：传送点旁绘制小型路标（墨线石碑/箭头，Graphics），E 交互后 Toast 提示「前往 X」（P2 简单版，P6 润色）。
- **塔入口**：保留现有 TOWER_GATE 逻辑（近距 E 开塔面板），位置迁至主城 (0,600)。

## 8. 实现任务分解（P2 实现清单）

| # | 任务 | 文件 |
|---|---|---|
| 1 | 数据结构：RegionDef/TeleportDef/NpcInstance 接口 | GameTypes.ts |
| 2 | Regions.ts：10 区域数据（布局/传送/NPC 实例/flagOnEnter） | Regions.ts（新） |
| 3 | GroundPainter：draw(region) 4 样式重绘 | GroundPainter.ts |
| 4 | CameraFollow：区域边界参数 | CameraFollow.ts |
| 5 | WorldManager：enterRegion 装配（清 NPC/重建/瞬移/snap/钳制/flag）+ 传送交互 | WorldManager.ts |
| 6 | 塔入口迁入 town + 路标装饰 | WorldManager.ts / Npcs.ts（TOWER_GATE pos） |
| 7 | GameManager.setFlag 预留 | GameManager.ts |
| 8 | 构建 + 验证 | — |

**验收标准**：
1. 10 区域均可到达（村庄→中枢→主城 / 任一庭院，双向返回）；
2. 各区域 NPC 与地面样式正确（场景树转储核对 NPC 实例与坐标）；
3. 玩家边界钳制随区域正确（不可走出区域）；
4. 塔入口在主城可开塔面板；
5. 旧 8 散人在主城可见可交互（切磋/传授/掉落不变）；
6. flagOnEnter 正确置位（arrive_hub/arrive_town/enter_sect）。

## 9. 设计确认结论（2026-08-17）

1. **旧 8 散人归位主城**：✅ 确认（序章村庄无散人，进主城可见）。
2. **中枢无 NPC**：✅ 暂定无（后续可添加，架构已支持）。
3. **首席弟子双地点**：✅ 同 id 双实例。
4. **问道塔入口**：✅ 修改为**大地图边界处**——主城东北角 (880,620)。
5. **山门节点布局**（西 3 东 3 南 1 + 南北通道）：✅ 暂定如此。
6. **区域切换瞬时完成**：✅ 暂定如此（P6 再议过渡效果）。
