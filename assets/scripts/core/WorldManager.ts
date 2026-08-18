import { _decorator, Component, Node, Vec3, input, Input, EventKeyboard, KeyCode, EventMouse, UITransform, Graphics, Label, Color } from 'cc';
import { GameManager } from './GameManager.ts';
import { CombatManager, BattleResult } from '../combat/CombatManager.ts';
import { PlayerController } from '../actors/PlayerController.ts';
import { Stickman } from '../actors/Stickman.ts';
import { NpcActor } from '../actors/NpcActor.ts';
import { EnemyAI } from '../actors/EnemyAI.ts';
import { CameraFollow } from '../actors/CameraFollow.ts';
import { InkBackground } from '../art/InkBackground.ts';
import { GroundPainter } from '../art/GroundPainter.ts';
import { EventBus, Events } from './EventBus.ts';
import { NPCS, TOWER_GATE } from '../data/Npcs.ts';
import { NpcDef, RegionDef, SectDef } from '../data/GameTypes.ts';
import { getRegionById } from '../data/Regions.ts';
import { getSectById } from '../data/Sects.ts';
import { HudPanel } from '../ui/HudPanel.ts';
import { NpcDialog } from '../ui/NpcDialog.ts';
import { BattleOverPanel } from '../ui/BattleOverPanel.ts';
import { BattleArena } from '../ui/BattleArena.ts';
import { MartialPanel } from '../ui/MartialPanel.ts';
import { CodexPanel } from '../ui/CodexPanel.ts';
import { QuestPanel } from '../ui/QuestPanel.ts';
import { SectPanel } from '../ui/SectPanel.ts';
import { TowerPanel } from '../ui/TowerPanel.ts';
import { Toast } from '../ui/Toast.ts';
import { getWeaponById } from '../data/Weapons.ts';
import { MARTIAL_ARTS, getBasicWugong } from '../data/MartialArts.ts';
import { getTowerFloor } from '../data/Tower.ts';
import { WEAPON_NAMES } from '../combat/DamageFormula.ts';

const { ccclass } = _decorator;

/** 主城/战斗模式 */
export enum WorldMode {
    Explore = 'explore',
    Battle = 'battle',
    Tower = 'tower',
}

/**
 * 墨江湖 - 主城装配与流程管理
 * 负责：创建背景/玩家/NPC/UI、交互检测、战斗触发与结算。
 */
@ccclass('WorldManager')
export class WorldManager extends Component {
    mode: WorldMode = WorldMode.Explore;
    playerNode: Node | null = null;
    private playerController: PlayerController | null = null;
    private npcActors: NpcActor[] = [];
    private fxRoot: Node | null = null;
    private floatRoot: Node | null = null;
    private worldRoot: Node | null = null;
    private uiRoot: Node | null = null;
    private bgLayer: InkBackground | null = null;
    private cameraFollow: CameraFollow | null = null;
    private ground: GroundPainter | null = null;
    private hud: HudPanel | null = null;
    private dialog: NpcDialog | null = null;
    private battleOver: BattleOverPanel | null = null;
    private battleArena: BattleArena | null = null;
    private martialPanel: MartialPanel | null = null;
    private codexPanel: CodexPanel | null = null;
    private questPanel: QuestPanel | null = null;
    private sectPanel: SectPanel | null = null;
    private towerPanel: TowerPanel | null = null;
    private toast: Toast | null = null;

    /** 当前区域（区域制） */
    private currentRegion: RegionDef | null = null;
    /** 问道塔入口节点（当前区域） */
    private towerNode: Node | null = null;
    /** 传送点路标节点（当前区域） */
    private signNodes: Node[] = [];

    /** 战斗边界（半宽/半高） */
    private arenaHalfW = 760;
    private arenaHalfH = 420;

    private currentNpc: NpcActor | null = null;
    /** 进入战斗前玩家在大世界的位置（退出战斗时恢复） */
    private playerWorldPos: Vec3 = new Vec3(0, 0, 0);

    onLoad(): void {
        // 由 GameRoot 在 onLoad 后调用 build()
    }

    /** 构建整个主城（场景根节点传入） */
    build(sceneRoot: Node): void {
        // ===== 分层结构 =====
        // 1. 远景层（Canvas 下，不随 World 移动，视差滚动）
        const bgNode = new Node('Background');
        sceneRoot.addChild(bgNode);
        this.bgLayer = bgNode.addComponent(InkBackground);

        // 2. World 容器（地面 + 玩家 + NPC，由 CameraFollow 反向移动实现镜头跟随）
        this.worldRoot = new Node('World');
        sceneRoot.addChild(this.worldRoot);

        // 3. 俯视地面（World 内，跟随镜头滚动；区域切换时按区域重绘）
        const groundNode = new Node('Ground');
        this.worldRoot.addChild(groundNode);
        this.ground = groundNode.addComponent(GroundPainter);

        // 4. 特效层 / 飘字层（Canvas 下，固定屏幕空间？不——特效需在世界坐标，放 World 外但跟 World 偏移）
        //    特效与飘字使用世界坐标，放在 World 容器内更合适
        this.fxRoot = new Node('FX');
        this.worldRoot.addChild(this.fxRoot);
        this.floatRoot = new Node('FloatText');
        this.worldRoot.addChild(this.floatRoot);

        // 5. UI 层（Canvas 下，固定屏幕空间）
        this.uiRoot = new Node('UI');
        sceneRoot.addChild(this.uiRoot);

        // 6. 相机跟随（挂 Canvas 下，驱动 World 反向移动）
        const followNode = new Node('CameraFollow');
        sceneRoot.addChild(followNode);
        const cf = followNode.addComponent(CameraFollow);
        cf.worldNode = this.worldRoot;
        this.cameraFollow = cf;

        // 玩家
        this.spawnPlayer();
        cf.target = this.playerNode;
        cf.snap();

        // 区域装配（初始：序章村庄）
        this.enterRegion('village');

        // 战斗管理器挂到场景根
        const cm = sceneRoot.getComponent(CombatManager) || sceneRoot.addComponent(CombatManager);
        cm.setup(this.playerNode!, null!, this.fxRoot, this.floatRoot);
        // 敌人节点稍后由战斗创建

        // UI
        this.hud = this.uiRoot.addComponent(HudPanel);
        this.dialog = this.uiRoot.addComponent(NpcDialog);
        this.battleOver = this.uiRoot.addComponent(BattleOverPanel);
        this.battleArena = this.uiRoot.addComponent(BattleArena);
        this.martialPanel = this.uiRoot.addComponent(MartialPanel);
        this.codexPanel = this.uiRoot.addComponent(CodexPanel);
        this.questPanel = this.uiRoot.addComponent(QuestPanel);
        this.sectPanel = this.uiRoot.addComponent(SectPanel);
        this.towerPanel = this.uiRoot.addComponent(TowerPanel);
        this.toast = this.uiRoot.addComponent(Toast);

        // 交互事件
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);

        // 订阅战斗结束
        EventBus.on(Events.BATTLE_END, this.onBattleEnded, this);
        EventBus.on(Events.NPC_DIALOG_OPEN, this.onDialogOpen, this);
        EventBus.on(Events.NPC_DIALOG_CLOSE, this.onDialogClose, this);
        EventBus.on(Events.TOWER_OPEN, this.onTowerOpen, this);
        EventBus.on(Events.TOWER_CLOSE, this.onTowerClose, this);
        EventBus.on(Events.TOWER_CHALLENGE, this.onTowerChallenge, this);

        this.mode = WorldMode.Explore;

        // P5 教学引导：新档开场提示（老档不提示）
        const gm = GameManager.inst;
        if (!gm.state.flags['shen_talk'] && !gm.state.sectId && gm.state.maxTowerFloor === 0 && gm.state.kills === 0) {
            setTimeout(() => {
                EventBus.emit(Events.TOAST, '你在一间小木屋中醒来……按 E 与院中的沈觅人交谈。');
            }, 900);
        }
    }

    onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        EventBus.off(Events.BATTLE_END, this.onBattleEnded, this);
        EventBus.off(Events.NPC_DIALOG_OPEN, this.onDialogOpen, this);
        EventBus.off(Events.NPC_DIALOG_CLOSE, this.onDialogClose, this);
        EventBus.off(Events.TOWER_OPEN, this.onTowerOpen, this);
        EventBus.off(Events.TOWER_CLOSE, this.onTowerClose, this);
        EventBus.off(Events.TOWER_CHALLENGE, this.onTowerChallenge, this);
        // ESC 退出时销毁世界节点（Background/World/UI/CameraFollow 是 Canvas 子节点，
        // 不随 WorldManager 组件自动销毁，需要手动清理）
        for (const n of [this.bgLayer?.node, this.worldRoot, this.uiRoot,
            this.cameraFollow?.node]) {
            if (n && n.isValid) { n.removeFromParent(); n.destroy(); }
        }
        this.bgLayer = null;
        this.worldRoot = null;
        this.uiRoot = null;
        this.fxRoot = null;
        this.floatRoot = null;
        this.cameraFollow = null;
        this.ground = null;
        this.hud = null;
        this.dialog = null;
        this.battleOver = null;
        this.battleArena = null;
        this.martialPanel = null;
        this.codexPanel = null;
        this.questPanel = null;
        this.sectPanel = null;
        this.towerPanel = null;
        this.toast = null;
        this.playerNode = null;
        this.playerController = null;
        this.npcActors = [];
        this.towerNode = null;
        this.signNodes = [];
        this.currentNpc = null;
        this.currentRegion = null;
    }

    // ============ 场景搭建 ============

    private spawnPlayer(): void {
        const node = new Node('Player');
        this.worldRoot!.addChild(node);
        node.setPosition(0, 0, 0);
        node.addComponent(UITransform);
        // 身体子节点（与 NPC 结构一致：Stickman/Graphics 挂在 body 上，规避同节点多渲染组件的渲染问题）
        const body = new Node('body');
        node.addChild(body);
        const stick = body.addComponent(Stickman);
        stick.weapon = getWeaponById(GameManager.inst.state.weaponId).type;
        stick.inkTone = 0.4;
        this.playerController = node.addComponent(PlayerController);
        this.playerNode = node;
    }

    // ============ 区域装配（第一章区域制） ============

    /** 切换到目标区域：重建地面/NPC、瞬移玩家、更新边界与镜头 */
    private enterRegion(regionId: string, spawnPos?: { x: number; y: number }): void {
        const region = getRegionById(regionId);
        if (!region) return;
        // 1. 清理旧区域 NPC、塔入口与路标（同步移除，不依赖帧末销毁）
        for (const a of this.npcActors) {
            a.node.removeFromParent();
            a.node.destroy();
        }
        this.npcActors = [];
        if (this.towerNode) {
            this.towerNode.removeFromParent();
            this.towerNode.destroy();
            this.towerNode = null;
        }
        for (const s of this.signNodes) {
            s.removeFromParent();
            s.destroy();
        }
        this.signNodes = [];
        // 2. 地面重绘
        if (this.ground) this.ground.draw(region);
        // 3. NPC 实例化
        this.spawnRegionNpcs(region);
        // 4. 传送点路标
        this.spawnSignposts(region);
        // 5. 玩家瞬移
        const sp = spawnPos ?? region.spawn ?? { x: 0, y: 0 };
        if (this.playerNode) this.playerNode.setPosition(sp.x, sp.y, 0);
        // 6. 镜头边界 + 立即跟随
        if (this.cameraFollow) {
            this.cameraFollow.mapHalfW = region.halfW;
            this.cameraFollow.mapHalfH = region.halfH;
            this.cameraFollow.snap();
        }
        // 7. 远景色调
        if (this.bgLayer && region.bgTone !== undefined) this.bgLayer.setTone(region.bgTone);
        this.currentRegion = region;
        // 8. 任务 flag（P5 任务日志用）
        if (region.flagOnEnter) GameManager.inst.setFlag(region.flagOnEnter);
    }

    private spawnRegionNpcs(region: RegionDef): void {
        for (const inst of region.npcs) {
            // 问道塔入口（特殊功能节点）
            if (inst.npcId === 'tower_gate') {
                this.spawnTowerGate(inst.pos);
                continue;
            }
            const def = NPCS[inst.npcId];
            if (!def) continue;
            this.spawnNpc(def, inst.pos, inst.facing, region.id.startsWith('sect_'));
        }
    }

    /** 问道塔入口（主城边界处）：塔造型 + 入口交互 */
    private spawnTowerGate(pos: { x: number; y: number }): void {
        const towerNode = new Node('TowerGate');
        this.worldRoot!.addChild(towerNode);
        towerNode.setPosition(pos.x, pos.y, 0);
        towerNode.addComponent(UITransform);
        const gateActor = towerNode.addComponent(NpcActor);
        gateActor.init(TOWER_GATE);
        // 塔造型（简化：画个塔形）
        const g = towerNode.addComponent(Graphics);
        g.lineWidth = 3;
        g.strokeColor.fromHEX('#3A3328');
        g.moveTo(-24, 0); g.lineTo(-24, 80); g.lineTo(0, 110); g.lineTo(24, 80); g.lineTo(24, 0); g.stroke();
        g.moveTo(-16, 20); g.lineTo(16, 20); g.stroke();
        g.moveTo(-16, 50); g.lineTo(16, 50); g.stroke();
        this.towerNode = towerNode;
    }

    /** 传送点路标（墨线石碑 + 名称子节点） */
    private spawnSignposts(region: RegionDef): void {
        for (const tp of region.teleports) {
            const node = new Node(`Sign_${tp.id}`);
            this.worldRoot!.addChild(node);
            node.setPosition(tp.pos.x, tp.pos.y, 0);
            const g = node.addComponent(Graphics);
            g.lineWidth = 3;
            g.strokeColor.fromHEX('#5A5244');
            g.moveTo(-14, -10); g.lineTo(14, -10); g.lineTo(14, 16); g.lineTo(-14, 16); g.lineTo(-14, -10); g.stroke();
            g.moveTo(0, -10); g.lineTo(0, -26); g.stroke();
            g.moveTo(-14, 3); g.lineTo(14, 3); g.stroke();
            const labelNode = new Node('label');
            node.addChild(labelNode);
            labelNode.setPosition(0, 36, 0);
            const l = labelNode.addComponent(Label);
            l.string = tp.label;
            l.fontSize = 15;
            l.color = new Color(70, 64, 50, 255);
            l.isBold = true;
            l.horizontalAlign = Label.HorizontalAlign.CENTER;
            l.overflow = Label.Overflow.SHRINK;
            labelNode.addComponent(UITransform).setContentSize(240, 24);
            const fixSign = (): void => {
                if (!labelNode.isValid) return;
                const ut = labelNode.getComponent(UITransform);
                if (ut) ut.setContentSize(240, 24);
            };
            setTimeout(fixSign, 0);
            this.signNodes.push(node);
        }
    }

    private spawnNpc(def: NpcDef, pos?: { x: number; y: number }, facing?: number, courtyard = false): NpcActor {
        const node = new Node(`Npc_${def.id}`);
        this.worldRoot!.addChild(node);
        const p = pos ?? def.pos;
        node.setPosition(p.x, p.y, 0);
        node.addComponent(UITransform);
        const actor = node.addComponent(NpcActor);
        actor.courtyard = courtyard;
        actor.init(def);
        if (facing !== undefined) {
            const stick = node.getComponentInChildren(Stickman);
            if (stick) stick.facing = facing;
        }
        this.npcActors.push(actor);
        return actor;
    }

    // ============ 交互 ============

    private onKeyDown(e: EventKeyboard): void {
        if (e.keyCode === KeyCode.KEY_E) this.tryInteract();
        if (e.keyCode === KeyCode.KEY_B) {
            if (this.mode !== WorldMode.Explore) return;
            if (this.blockedByFlow('learn_3', '尚未习得武艺，先与沈觅人交谈。')) return;
            this.martialPanel?.toggle();
        }
        if (e.keyCode === KeyCode.KEY_C) {
            if (this.mode !== WorldMode.Explore) return;
            if (this.blockedByFlow('arrive_town', '江湖见闻尚浅，进城后再翻阅图鉴。')) return;
            this.codexPanel?.toggle();
        }
        if (e.keyCode === KeyCode.KEY_Q) {
            if (this.mode !== WorldMode.Explore) return;
            this.questPanel?.toggle();
        }
        if (e.keyCode === KeyCode.KEY_V) {
            if (this.mode !== WorldMode.Explore) return;
            if (this.blockedByFlow('arrive_town', '门派之事，进城后再打听。')) return;
            this.sectPanel?.toggle();
        }
        if (e.keyCode === KeyCode.ESCAPE) {
            if (this.dialog?.isOpen) this.dialog.close();
            else if (this.battleOver?.isOpen) this.battleOver.close();
            else if (this.codexPanel?.isOpen) this.codexPanel.close();
            else if (this.martialPanel?.isOpen) this.martialPanel.close();
            else if (this.questPanel?.isOpen) this.questPanel.close();
            else if (this.sectPanel?.isOpen) this.sectPanel.close();
            else if (this.towerPanel?.isOpen) this.towerPanel.close();
            else if (CombatManager.inst.inBattle) {
                this.toast?.show('战斗中不可退出，认输请按 Y');
            } else {
                // 无面板打开 + 非战斗 → 保存并返回存档页面
                GameManager.inst.save();
                EventBus.emit(Events.TOAST, '已保存，返回存档页面');
                EventBus.emit(Events.MENU_EXIT);
            }
        }
        // 认输
        if (e.keyCode === KeyCode.KEY_Y && CombatManager.inst.inBattle) {
            CombatManager.inst.surrender();
        }
    }

    private onMouseDown(e: EventMouse): void {
        if (this.mode !== WorldMode.Explore) return;
        if (this.dialog?.isOpen || this.martialPanel?.isOpen || this.towerPanel?.isOpen) return;
        // 点击 NPC 交互（通过 NpcActor 的按钮化节点，这里简化：检测最近 NPC）
        if (!this.playerNode) return;
        const mouse = e.getUILocation();
        // 简化：点击逻辑交给节点上的 NpcActor（通过世界坐标转换太复杂），
        // 这里保留 E 键交互为主；点击交互由 NpcActor 挂 Button 实现（后续）。
    }

    tryInteract(): void {
        if (this.mode !== WorldMode.Explore || !this.playerNode) return;
        if (this.dialog?.isOpen || this.martialPanel?.isOpen || this.towerPanel?.isOpen) return;
        // 找最近的可交互 NPC
        let nearest: NpcActor | null = null;
        let bestDist = 130;
        for (const actor of this.npcActors) {
            if (actor.isPlayerNear(this.playerNode.position)) {
                const d = Vec3.distance(actor.node.position, this.playerNode.position);
                if (d < bestDist) { bestDist = d; nearest = actor; }
            }
        }
        // 塔入口（当前区域）
        if (this.towerNode) {
            const towerDist = Vec3.distance(this.towerNode.position, this.playerNode.position);
            if (towerDist < 140) {
                EventBus.emit(Events.TOWER_OPEN);
                return;
            }
        }
        // 传送点（当前区域；P5 序章 gating：下山道需玉佩、城门需切磋）
        if (this.currentRegion) {
            for (const tp of this.currentRegion.teleports) {
                const d = Vec3.distance(new Vec3(tp.pos.x, tp.pos.y, 0), this.playerNode.position);
                if (d < (tp.radius ?? 90)) {
                    const gm = GameManager.inst;
                    const advanced = !!gm.state.sectId || gm.state.maxTowerFloor > 0 || gm.state.kills > 0;
                    if (!advanced) {
                        if (tp.id === 'village_to_hub' && !gm.state.flags['get_pendant']) {
                            EventBus.emit(Events.TOAST, '沈先生似乎还有话要说……');
                            return;
                        }
                        if (tp.id === 'hub_to_town' && !gm.state.flags['spar_shen']) {
                            EventBus.emit(Events.TOAST, '山道口，沈觅人正等你切磋一场。');
                            return;
                        }
                    }
                    this.enterRegion(tp.to, tp.spawn);
                    if (tp.id === 'village_to_hub') gm.setFlag('leave_village');
                    EventBus.emit(Events.TOAST, `前往${tp.label}…`);
                    return;
                }
            }
        }
        if (nearest) nearest.interact();
    }

    /** 新手流程面板门禁：老档（已有门派/爬塔/击杀）不拦截 */
    private blockedByFlow(flag: string, hint: string): boolean {
        const gm = GameManager.inst;
        if (gm.state.flags[flag]) return false;
        if (gm.state.sectId || gm.state.maxTowerFloor > 0 || gm.state.kills > 0) return false;
        EventBus.emit(Events.TOAST, hint);
        return true;
    }

    // ============ 对话与战斗 ============

    private onDialogOpen(def: NpcDef, actor: NpcActor): void {
        this.currentNpc = actor;
        const gm = GameManager.inst;
        // P5 剧情 flag：与沈觅人交谈 / 与招募者交谈（任务日志）
        if (def.id === 'shenmiren') gm.setFlag('shen_talk');
        if (def.role === 'recruiter') gm.setFlag('met_recruiter');
        this.dialog?.open(def, (action: string) => {
            if (action === 'fight') this.startNpcDuel(def, actor);
            else if (action === 'teach') {
                if (def.teachMartial) {
                    const ma = MARTIAL_ARTS[def.teachMartial];
                    GameManager.inst.gainMartial(def.teachMartial);
                    // gainMartial 内部会发 Toast「习得武学：中文名」，这里只关面板
                }
                this.dialog?.close();
            } else if (action === 'goto_sect') {
                // 招募者：前往门派庭院
                this.dialog?.close();
                const sect = def.sectId ? getSectById(def.sectId) : undefined;
                if (sect) {
                    this.enterRegion(sect.regionId);
                    EventBus.emit(Events.TOAST, `随${def.name}前往${sect.name}…`);
                }
            } else if (action === 'trial') {
                // 掌门：拜师考核（与首席弟子切磋）
                this.dialog?.close();
                const sect = def.sectId ? getSectById(def.sectId) : undefined;
                if (!sect) return;
                const recruiter = NPCS[sect.recruiterId];
                if (!recruiter) return;
                this.startTrialBattle(sect, recruiter);
            } else if (action === 'learn3') {
                // 序章：沈觅人授三艺（吐纳诀/健步功/基础剑式）
                for (const mid of ['tunajue', 'jianbugong', 'jichujianshi']) {
                    if (!gm.state.ownedMartials.includes(mid)) gm.state.ownedMartials.push(mid);
                }
                gm.save();
                gm.setFlag('learn_3');
                EventBus.emit(Events.TOAST, '你习得吐纳诀、健步功与基础剑式！（B 键打开武学面板）');
                this.dialog?.close();
            } else if (action === 'stump_go') {
                // 序章：指引去木桩
                EventBus.emit(Events.TOAST, '村口西侧的木桩——去试试你的出手。');
                this.dialog?.close();
            } else if (action === 'stump') {
                // 木桩试炼（普攻教学）
                gm.setFlag('stump_done');
                EventBus.emit(Events.TOAST, '你朝木桩连连出手——嘭！气息渐稳。（战斗中普攻不耗内力）');
                this.dialog?.close();
            } else if (action === 'pendant_get') {
                // 临别赠玉
                gm.addQuestItem('玉佩');
                gm.setFlag('get_pendant');
                EventBus.emit(Events.TOAST, '你收下玉佩——玉质温润，背面隐约有一枚印记。');
                this.dialog?.close();
            } else if (action === 'leave_hint') {
                EventBus.emit(Events.TOAST, '顺着村南的下山道，下山去吧。');
                this.dialog?.close();
            } else if (action === 'pendant') {
                // 终局钩子：掌门提及玉佩印记
                gm.setFlag('pendant_mark');
                this.dialog?.close();
                EventBus.emit(Events.TOAST, '「这玉佩上的印记……」掌门凝视良久，「竟与我派卷宗所载一般无二。」');
            } else if (action === 'rumor_a' || action === 'rumor_b' || action === 'rumor_c') {
                // 说书人三闻（可连续听；三闻集齐 → rumors_done）
                gm.setFlag(action);
                if (gm.state.flags['rumor_a'] && gm.state.flags['rumor_b'] && gm.state.flags['rumor_c']) {
                    gm.setFlag('rumors_done');
                    EventBus.emit(Events.TOAST, '三桩江湖传闻，你都听进心里了。');
                }
            }
        }, { courtyard: actor.courtyard });
    }

    /** 拜师考核战：与门派首席弟子切磋（只考基本功：首席仅用基础武学、等级下调）；
     *  苏婉清考核只守不攻（琴音试心性） */
    private startTrialBattle(sect: SectDef, recruiter: NpcDef): void {
        // 考核模板：基础武学 + 等级 ×0.75（保证流程可达，难度曲线 P6 调优）
        const basic = getBasicWugong(recruiter.weapon);
        const trialDef: NpcDef = {
            ...recruiter,
            level: Math.max(1, Math.round(recruiter.level * 0.75)),
            skillIds: basic ? [basic.id] : [],
        };
        this.enterBattle((arena, cm) => {
            const enemyNode = new Node(`TrialEnemy_${recruiter.id}`);
            arena.arenaRoot!.addChild(enemyNode);
            enemyNode.addComponent(UITransform);
            const stick = enemyNode.addComponent(Stickman);
            stick.weapon = recruiter.weapon;
            stick.inkTone = recruiter.inkTone ?? 0.5;
            stick.facing = -1;
            const ai = enemyNode.addComponent(EnemyAI);
            ai.defendOnly = recruiter.id === 'suwanqing';
            cm.enemyNode = enemyNode;
            cm.setup(this.playerNode!, enemyNode, arena.fxRoot!, arena.floatRoot!);
            cm.startNpcBattle(trialDef, (r: BattleResult) => {
                ai.unbind();
                this.exitBattle(r, enemyNode);
                if (r.win) {
                    const ok = GameManager.inst.joinSect(sect.id);
                    if (ok) {
                        EventBus.emit(Events.TOAST, `通过考核，拜入${sect.name}！`);
                        // 终局钩子：沈觅人的无字信（q15）
                        GameManager.inst.addQuestItem('无字信');
                        GameManager.inst.setFlag('letter_opened');
                        EventBus.emit(Events.TOAST, '你拆开沈觅人留下的无字信——纸上一字也无。');
                    }
                } else {
                    EventBus.emit(Events.TOAST, '考核失败，可稍后再来挑战');
                }
            });
            ai.bind();
        });
    }

    private onDialogClose(): void {
        this.currentNpc = null;
    }

    /** 开始切磋 */
    private startNpcDuel(def: NpcDef, actor: NpcActor): void {
        this.dialog?.close();
        this.enterBattle((arena, cm) => {
            // 创建敌人节点（挂战斗界面 arena 下）
            const enemyNode = new Node(`Enemy_${def.id}`);
            arena.arenaRoot!.addChild(enemyNode);
            enemyNode.addComponent(UITransform);
            const stick = enemyNode.addComponent(Stickman);
            stick.weapon = def.weapon;
            stick.inkTone = def.inkTone ?? 0.5;
            stick.facing = -1;
            // 敌人 AI
            const ai = enemyNode.addComponent(EnemyAI);
            cm.enemyNode = enemyNode;
            cm.setup(this.playerNode!, enemyNode, arena.fxRoot!, arena.floatRoot!);
            // 启动战斗，AI 绑定在 beginBattle 后
            cm.startNpcBattle(def, (r: BattleResult) => {
                ai.unbind();
                this.exitBattle(r, enemyNode);
            });
            // 战斗开始后绑定 AI（事件驱动）
            ai.bind();
        });
    }

    /** 爬塔战斗（由 TowerPanel 发起） */
    startTowerFight(floor: number, onDone: () => void): void {
        if (this.mode !== WorldMode.Explore) return;
        this.enterBattle((arena, cm) => {
            const enemyNode = new Node(`TowerEnemy_${floor}`);
            arena.arenaRoot!.addChild(enemyNode);
            enemyNode.addComponent(UITransform);
            const stick = enemyNode.addComponent(Stickman);
            const def = getTowerFloor(floor);
            stick.weapon = def.weapon;
            stick.inkTone = Math.min(0.85, 0.45 + floor * 0.02);
            stick.facing = -1;
            const ai = enemyNode.addComponent(EnemyAI);
            cm.enemyNode = enemyNode;
            cm.setup(this.playerNode!, enemyNode, arena.fxRoot!, arena.floatRoot!);
            cm.startTowerBattle(floor, (r: BattleResult) => {
                ai.unbind();
                if (r.win) {
                    const gm = GameManager.inst;
                    if (floor > gm.state.maxTowerFloor) {
                        gm.state.maxTowerFloor = floor;
                        gm.save();
                    }
                }
                this.exitBattle(r, enemyNode);
                onDone();
            });
            ai.bind();
        });
    }

    /**
     * 进入战斗：隐藏大世界、显示战斗界面、把玩家挂到战斗界面下
     */
    private enterBattle(configure: (arena: BattleArena, cm: CombatManager) => void): void {
        const arena = this.battleArena!;
        const cm = CombatManager.inst;

        this.mode = WorldMode.Battle;
        this.playerController!.inBattle = true;

        // 保存玩家在大世界的位置，稍后恢复
        this.playerWorldPos = this.playerNode!.position.clone();

        // 1. 隐藏大世界（World + 远景），暂停镜头跟随
        if (this.worldRoot) this.worldRoot.active = false;
        if (this.cameraFollow) this.cameraFollow.enabled = false;

        // 2. 显示战斗界面
        arena.show();

        // 3. 玩家节点挂到战斗界面 arena 下，摆位左侧
        const player = this.playerNode!;
        player.setParent(arena.arenaRoot!);
        player.setPosition(-160, 0, 0);
        if (this.playerController && this.playerController.getComponentInChildren(Stickman)) {
            this.playerController.getComponentInChildren(Stickman).facing = 1;
        }

        // 4. 让配置函数创建敌人并启动战斗
        configure(arena, cm);
    }

    /** 退出战斗：隐藏战斗界面、恢复大世界、结算 */
    private exitBattle(r: BattleResult, enemyNode: Node): void {
        const arena = this.battleArena!;
        const cm = CombatManager.inst;

        // 1. 隐藏战斗界面
        arena.hide();
        cm.enemyNode = null;
        enemyNode.destroy();

        // 2. 玩家节点挂回大世界，恢复位置
        const player = this.playerNode!;
        player.setParent(this.worldRoot!);
        player.setPosition(this.playerWorldPos.x, this.playerWorldPos.y, 0);

        // 3. 恢复大世界 + 镜头跟随
        if (this.worldRoot) this.worldRoot.active = true;
        if (this.cameraFollow) {
            this.cameraFollow.enabled = true;
            this.cameraFollow.snap();
        }

        this.mode = WorldMode.Explore;
        this.playerController!.inBattle = false;

        // 4. 胜利结算：修为/掉落
        if (r.win) {
            GameManager.inst.onBattleWin(r.xp, r.dropMartial, r.dropWeapon);
        }
        this.showBattleResult(r);
    }

    private onBattleEnded(result: BattleResult): void {
        // 供外部监听（若有）
    }

    private showBattleResult(r: BattleResult): void {
        this.battleOver?.open(r);
    }

    private onTowerOpen(): void {
        this.towerPanel?.open();
    }

    private onTowerClose(): void {
        // 面板自身已关闭（close() 内部 emit），此处仅作通知，无需再次调用 close()
    }

    private onTowerChallenge(floor: number): void {
        this.startTowerFight(floor, () => {});
    }

    /** 每帧：驱动镜头跟随、视差背景、竞技场边界 */
    update(_dt: number): void {
        // 视差背景跟随世界偏移（CameraFollow 的 update 由引擎自动调用）
        if (this.cameraFollow && this.bgLayer) {
            this.bgLayer.setWorldOffset(this.cameraFollow.offsetX, this.cameraFollow.offsetY);
        }
        if (!this.playerNode) return;
        const p = this.playerNode.position;
        // 探索模式：限制在当前区域边界内
        if (this.mode === WorldMode.Explore) {
            const hw = this.currentRegion ? this.currentRegion.halfW : 600;
            const hh = this.currentRegion ? this.currentRegion.halfH : 450;
            const clamped = new Vec3(
                Math.max(-hw + 40, Math.min(hw - 40, p.x)),
                Math.max(-hh + 40, Math.min(hh - 40, p.y)),
                0,
            );
            if (clamped.x !== p.x || clamped.y !== p.y) this.playerNode.setPosition(clamped);
        } else {
            // 战斗模式：限制在战斗擂台边界内（arena 本地坐标）
            const clamped = new Vec3(
                Math.max(-440, Math.min(440, p.x)),
                Math.max(-130, Math.min(130, p.y)),
                0,
            );
            if (clamped.x !== p.x || clamped.y !== p.y) this.playerNode.setPosition(clamped);
        }
        // 敌人节点位置由 CombatManager 同步
    }
}
