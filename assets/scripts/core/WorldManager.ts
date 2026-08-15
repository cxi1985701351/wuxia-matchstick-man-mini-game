import { _decorator, Component, Node, Vec3, input, Input, EventKeyboard, KeyCode, EventMouse, UITransform, Graphics, Label } from 'cc';
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
import { NpcDef } from '../data/GameTypes.ts';
import { HudPanel } from '../ui/HudPanel.ts';
import { NpcDialog } from '../ui/NpcDialog.ts';
import { BattleOverPanel } from '../ui/BattleOverPanel.ts';
import { BattleArena } from '../ui/BattleArena.ts';
import { MartialPanel } from '../ui/MartialPanel.ts';
import { TowerPanel } from '../ui/TowerPanel.ts';
import { Toast } from '../ui/Toast.ts';
import { getWeaponById } from '../data/Weapons.ts';
import { MARTIAL_ARTS } from '../data/MartialArts.ts';
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
    private towerPanel: TowerPanel | null = null;
    private toast: Toast | null = null;

    /** 地图半宽/半高（世界坐标，地面尺寸） */
    private readonly mapHalfW = 1000;
    private readonly mapHalfH = 650;

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

        // 3. 俯视地面（World 内，跟随镜头滚动）
        const groundNode = new Node('Ground');
        this.worldRoot.addChild(groundNode);
        const ground = groundNode.addComponent(GroundPainter);
        ground.mapHalfW = this.mapHalfW;
        ground.mapHalfH = this.mapHalfH;
        ground.drawOnce();
        this.ground = ground;

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

        // NPC
        this.spawnNpcs();

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
    }

    // ============ 场景搭建 ============

    private spawnPlayer(): void {
        const node = new Node('Player');
        this.worldRoot!.addChild(node);
        node.setPosition(0, 0, 0);
        node.addComponent(UITransform);
        const stick = node.addComponent(Stickman);
        stick.weapon = getWeaponById(GameManager.inst.state.weaponId).type;
        stick.inkTone = 0.4;
        this.playerController = node.addComponent(PlayerController);
        this.playerNode = node;
    }

    private spawnNpcs(): void {
        for (const key of Object.keys(NPCS)) {
            const def = NPCS[key];
            this.spawnNpc(def);
        }
        // 塔入口
        const towerNode = new Node('TowerGate');
        this.worldRoot!.addChild(towerNode);
        towerNode.setPosition(TOWER_GATE.pos.x, TOWER_GATE.pos.y, 0);
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
    }

    private spawnNpc(def: NpcDef): NpcActor {
        const node = new Node(`Npc_${def.id}`);
        this.worldRoot!.addChild(node);
        node.setPosition(def.pos.x, def.pos.y, 0);
        node.addComponent(UITransform);
        const actor = node.addComponent(NpcActor);
        actor.init(def);
        this.npcActors.push(actor);
        return actor;
    }

    // ============ 交互 ============

    private onKeyDown(e: EventKeyboard): void {
        if (e.keyCode === KeyCode.KEY_E) this.tryInteract();
        if (e.keyCode === KeyCode.KEY_B) {
            if (this.mode !== WorldMode.Explore) return;
            this.martialPanel?.toggle();
        }
        if (e.keyCode === KeyCode.ESCAPE) {
            if (this.dialog?.isOpen) this.dialog.close();
            else if (this.battleOver?.isOpen) this.battleOver.close();
            else if (this.martialPanel?.isOpen) this.martialPanel.close();
            else if (this.towerPanel?.isOpen) this.towerPanel.close();
            else if (CombatManager.inst.inBattle) {
                this.toast?.show('战斗中不可退出，认输请按 Y');
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
        // 塔入口
        const towerDist = Vec3.distance(new Vec3(TOWER_GATE.pos.x, TOWER_GATE.pos.y, 0), this.playerNode.position);
        if (towerDist < 140) {
            EventBus.emit(Events.TOWER_OPEN);
            return;
        }
        if (nearest) nearest.interact();
    }

    // ============ 对话与战斗 ============

    private onDialogOpen(def: NpcDef, actor: NpcActor): void {
        this.currentNpc = actor;
        this.dialog?.open(def, (action: string) => {
            if (action === 'fight') this.startNpcDuel(def, actor);
            else if (action === 'teach') {
                if (def.teachMartial) {
                    const ma = MARTIAL_ARTS[def.teachMartial];
                    GameManager.inst.gainMartial(def.teachMartial);
                    // gainMartial 内部会发 Toast「习得武学：中文名」，这里只关面板
                }
                this.dialog?.close();
            }
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
        if (this.playerController && this.playerController.getComponent(Stickman)) {
            this.playerController.getComponent(Stickman).facing = 1;
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
        // 探索模式：限制在地图边界内
        if (this.mode === WorldMode.Explore) {
            const clamped = new Vec3(
                Math.max(-this.mapHalfW + 40, Math.min(this.mapHalfW - 40, p.x)),
                Math.max(-this.mapHalfH + 40, Math.min(this.mapHalfH - 40, p.y)),
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
