import { _decorator, Component, Node, Vec3, Label, tween, UIOpacity, UITransform } from 'cc';
import { BattleEntity, BattleEntityData } from './BattleEntity.ts';
import { DamageFormula, DamageResult } from './DamageFormula.ts';
import { GameManager } from '../core/GameManager.ts';
import { EventBus, Events } from '../core/EventBus.ts';
import { NpcDef, SkillDef, WeaponType, FighterStats } from '../data/GameTypes.ts';
import { MARTIAL_ARTS } from '../data/MartialArts.ts';
import { getWeaponById } from '../data/Weapons.ts';
import { StatCalculator } from './StatCalculator.ts';
import { InkEffects } from '../art/InkEffects.ts';
import { Stickman, StickPose } from '../actors/Stickman.ts';
import { getTowerFloor } from '../data/Tower.ts';

const { ccclass } = _decorator;

/** 战斗结束结果 */
export interface BattleResult {
    win: boolean;
    xp: number;
    dropMartial?: string;
    dropWeapon?: string;
}

/** 回合制行动指令 */
export type BattleAction =
    | { type: 'basic' }
    | { type: 'skill'; skill: SkillDef }
    | { type: 'defend' };

/**
 * 墨江湖 - 回合制战斗管理器
 * 回合流程：按速度定先后手 → 先手行动 → 后手行动 → 回合结束（冷却递减）→ 下一回合。
 * 玩家通过 BattleArena 指令面板选择行动；敌人由 EnemyAI 决策。
 */
@ccclass('CombatManager')
export class CombatManager extends Component {
    private static _inst: CombatManager | null = null;
    static get inst(): CombatManager {
        if (!this._inst) throw new Error('CombatManager not initialized!');
        return this._inst;
    }

    inBattle: boolean = false;
    player: BattleEntity | null = null;
    enemy: BattleEntity | null = null;
    /** 当前回合数 */
    turn: number = 1;
    /** 是否等待玩家行动（玩家回合） */
    awaitingPlayer: boolean = false;
    /** 本回合行动方（先手为 true=玩家） */
    playerFirst: boolean = true;

    /** 玩家火柴人节点 */
    playerNode: Node | null = null;
    /** 敌人火柴人节点 */
    enemyNode: Node | null = null;

    private playerStick: Stickman | null = null;
    private enemyStick: Stickman | null = null;
    /** 特效层 */
    fxRoot: Node | null = null;
    /** 飘字层（世界坐标） */
    floatRoot: Node | null = null;

    private currentDropMartial?: string;
    private currentDropWeapon?: string;
    private currentXp: number = 0;
    private onEnded: ((r: BattleResult) => void) | null = null;
    private turnInProgress: boolean = false;

    /** 双方出生位置（战斗界面 arena 本地坐标） */
    private playerSpawn: Vec3 = new Vec3(-160, 0, 0);
    private enemySpawn: Vec3 = new Vec3(160, 0, 0);

    protected onLoad(): void {
        CombatManager._inst = this;
    }

    onDestroy(): void {
        if (CombatManager._inst === this) CombatManager._inst = null;
    }

    /** 配置战斗场景（由 WorldManager 调用） */
    setup(playerNode: Node, enemyNode: Node, fxRoot: Node, floatRoot: Node): void {
        this.playerNode = playerNode;
        this.enemyNode = enemyNode;
        this.fxRoot = fxRoot;
        this.floatRoot = floatRoot;
        this.playerStick = playerNode.getComponent(Stickman);
        this.enemyStick = enemyNode ? enemyNode.getComponent(Stickman) : null;
    }

    // ============ 创建战斗实体 ============

    /** 开始战斗：玩家 vs NPC */
    startNpcBattle(npc: NpcDef, onEnded: (r: BattleResult) => void): void {
        const player = this.createPlayerEntity();
        // 敌人实体
        const enemyStats = StatCalculator.compute(npc.level, npc.weapon as string, undefined, undefined, []);
        const npcWeapon = getWeaponById(npc.weapon as string);
        const enemyData: BattleEntityData = {
            id: npc.id,
            name: npc.name,
            stats: {
                maxHp: Math.round(enemyStats.maxHp * 0.85), hp: Math.round(enemyStats.maxHp * 0.85),
                maxMp: enemyStats.maxMp, mp: enemyStats.maxMp,
                atk: Math.round(enemyStats.atk * 0.8), def: enemyStats.def,
                spd: enemyStats.spd * 0.85, atkSpd: enemyStats.atkSpd * 0.9,
                dodge: enemyStats.dodge, crit: enemyStats.crit,
                mpRegen: enemyStats.mpRegen, hpRegen: 0,
                cdReduce: 0, dashCd: 1.5,
            },
            weapon: npc.weapon,
            weaponRange: npcWeapon.range,
            skills: npc.skillIds.map((id) => MARTIAL_ARTS[id]?.skill).filter((x): x is SkillDef => !!x),
            passives: [],
            isPlayer: false,
        };
        const enemy = new BattleEntity(enemyData);
        this.beginBattle(player, enemy, npc.xp, npc.dropMartial, npc.dropWeapon, onEnded);
    }

    /** 开始战斗：玩家 vs 塔层守卫 */
    startTowerBattle(floor: number, onEnded: (r: BattleResult) => void): void {
        const towerDef = getTowerFloor(floor);
        const player = this.createPlayerEntity();
        const base = StatCalculator.compute(towerDef.level, towerDef.weapon as string, undefined, undefined, []);
        const sc = towerDef.statScale;
        const towerWeapon = getWeaponById(towerDef.weapon as string);
        const enemyData: BattleEntityData = {
            id: `tower_${floor}`, name: towerDef.guardName,
            stats: {
                maxHp: Math.round(base.maxHp * 0.85 * sc), hp: Math.round(base.maxHp * 0.85 * sc),
                maxMp: Math.round(base.maxMp * sc), mp: Math.round(base.maxMp * sc),
                atk: Math.round(base.atk * 0.8 * sc), def: Math.round(base.def * sc),
                spd: base.spd * (0.85 + 0.1 * sc), atkSpd: base.atkSpd * 0.9,
                dodge: Math.min(0.3, base.dodge + (sc - 1) * 0.02),
                crit: Math.min(0.4, base.crit + (sc - 1) * 0.02),
                mpRegen: base.mpRegen, hpRegen: 0,
                cdReduce: 0, dashCd: 1.5,
            },
            weapon: towerDef.weapon, weaponRange: towerWeapon.range,
            skills: towerDef.skillIds.map((id) => MARTIAL_ARTS[id]?.skill).filter((x): x is SkillDef => !!x),
            passives: [], isPlayer: false,
        };
        const enemy = new BattleEntity(enemyData);
        this.beginBattle(player, enemy, towerDef.xp, towerDef.dropMartial, towerDef.dropWeapon, onEnded);
    }

    private createPlayerEntity(): BattleEntity {
        const gm = GameManager.inst;
        const stats = gm.stats!;
        const equippedSkills = gm.state.equipped.wugong
            .filter((x): x is string => !!x)
            .map((mid) => MARTIAL_ARTS[mid]?.skill)
            .filter((x): x is SkillDef => !!x);
        const weapon = getWeaponById(gm.state.weaponId);
        const playerData: BattleEntityData = {
            id: 'player',
            name: '修士',
            stats: { ...stats } as any,
            weapon: weapon.type,
            weaponRange: weapon.range,
            skills: equippedSkills,
            passives: this.collectPassives(),
            isPlayer: true,
        };
        return new BattleEntity(playerData);
    }

    private collectPassives(): string[] {
        const gm = GameManager.inst;
        const list: string[] = [];
        for (const mid of [gm.state.equipped.neigong, gm.state.equipped.qinggong, ...gm.state.equipped.wugong]) {
            if (!mid) continue;
            const ma = MARTIAL_ARTS[mid];
            if (ma?.passives) list.push(...ma.passives);
        }
        return list;
    }

    // ============ 回合流程 ============

    private beginBattle(
        player: BattleEntity,
        enemy: BattleEntity,
        xp: number,
        dropMartial?: string,
        dropWeapon?: string,
        onEnded?: (r: BattleResult) => void,
    ): void {
        this.player = player;
        this.enemy = enemy;
        this.currentXp = xp;
        this.currentDropMartial = dropMartial;
        this.currentDropWeapon = dropWeapon;
        this.onEnded = onEnded ?? null;
        this.inBattle = true;
        this.turn = 1;
        this.turnInProgress = false;

        // 摆位
        if (this.playerNode) {
            this.playerNode.setPosition(this.playerSpawn);
            player.pos = { x: this.playerSpawn.x, y: this.playerSpawn.y };
            this.playerStick?.play(StickPose.Idle);
            this.playerStick!.facing = 1;
        }
        if (this.enemyNode) {
            this.enemyNode.setPosition(this.enemySpawn);
            enemy.pos = { x: this.enemySpawn.x, y: this.enemySpawn.y };
            this.enemyStick?.play(StickPose.Idle);
        }

        EventBus.emit(Events.BATTLE_START, player, enemy);
        // 开始第一回合
        this.startTurn();
    }

    /** 开始一个回合：按速度定先后手 */
    private startTurn(): void {
        if (!this.inBattle || !this.player || !this.enemy) return;
        const p = this.player;
        const e = this.enemy;
        // 速度决定先后手（含减速影响）
        const pSpd = p.effSpd + Math.random() * 10;
        const eSpd = e.effSpd + Math.random() * 10;
        this.playerFirst = pSpd >= eSpd;
        this.turnInProgress = false;
        this.awaitingPlayer = false;

        EventBus.emit(Events.TURN_START, this.turn, this.playerFirst);

        // 先手方行动
        this.scheduleOnce(() => {
            this.runActorTurn(this.playerFirst ? p : e);
        }, 0.4);
    }

    /** 执行一个实体的回合行动 */
    private runActorTurn(actor: BattleEntity): void {
        if (!this.inBattle) return;
        const isPlayerTurn = actor === this.player;

        // 眩晕：跳过行动
        if (!actor.canAct) {
            this.spawnFloat(actor.pos, '晕', '#8E2B2B', true);
            EventBus.emit(Events.ACTOR_TURN_DONE, isPlayerTurn);
            this.afterActorTurn(isPlayerTurn);
            return;
        }

        if (isPlayerTurn) {
            // 等待玩家从指令面板选择
            this.awaitingPlayer = true;
            EventBus.emit(Events.PLAYER_TURN, this.turn);
        } else {
            // 敌人 AI 决策（直接调用已绑定的 EnemyAI 组件）
            this.scheduleOnce(() => {
                if (!this.inBattle || !this.enemy) return;
                const ai = (this as any).enemyAI;
                if (ai && typeof ai.decide === 'function') {
                    ai.decide(this, this.enemy);
                } else {
                    // 兜底：无 AI 时普攻
                    this.enemyAct({ type: 'basic' });
                }
            }, 0.3);
        }
    }

    /** 玩家提交行动（由 BattleArena 指令面板调用） */
    playerAct(action: BattleAction): void {
        if (!this.awaitingPlayer || !this.player || !this.enemy) return;
        this.awaitingPlayer = false;
        const p = this.player;
        const e = this.enemy;
        if (action.type === 'basic') {
            this.spawnFloat(p.pos, '剑', '#2B2B2B');
            this.playerStick?.play(StickPose.Attack, 0.4);
            this.resolveHit(p, e, null);
        } else if (action.type === 'skill') {
            this.playerStick?.play(StickPose.Cast, 0.5);
            this.castSkillEntity(p, e, action.skill);
        } else if (action.type === 'defend') {
            // 防御：本回合受到伤害减半
            p.defending = true;
            this.spawnFloat(p.pos, '防', '#4A5A3A', true);
            EventBus.emit(Events.TOAST, '你摆出防御架势，本回合受伤减半');
        }
        EventBus.emit(Events.ACTOR_TURN_DONE, true);
        this.afterActorTurn(true);
    }

    /** 敌人行动（由 EnemyAI 决策后调用） */
    enemyAct(action: BattleAction): void {
        if (!this.inBattle || !this.player || !this.enemy) return;
        const e = this.enemy;
        const p = this.player;
        if (!e.canAct) {
            this.afterActorTurn(false);
            return;
        }
        if (action.type === 'basic') {
            this.enemyStick?.play(StickPose.Attack, 0.4);
            this.resolveHit(e, p, null);
        } else if (action.type === 'skill') {
            this.enemyStick?.play(StickPose.Cast, 0.5);
            this.castSkillEntity(e, p, action.skill);
        } else if (action.type === 'defend') {
            e.defending = true;
            this.spawnFloat(e.pos, '防', '#4A5A3A', true);
        }
        EventBus.emit(Events.ACTOR_TURN_DONE, false);
        this.afterActorTurn(false);
    }

    /** 实体释放技能 */
    private castSkillEntity(actor: BattleEntity, target: BattleEntity, skill: SkillDef): void {
        if (!actor.skillReady(skill)) {
            EventBus.emit(Events.TOAST, '内力不足或冷却中');
            return;
        }
        actor.castSkill(skill);
        // 特效
        this.spawnSkillFx(skill, target.pos, actor.facing);
        // 多段伤害
        for (let i = 0; i < skill.hitCount; i++) {
            if (!target.alive) break;
            const result = DamageFormula.roll({
                atk: actor.data.stats.atk,
                def: target.effDef,
                crit: actor.data.stats.crit,
                dodge: target.data.stats.dodge,
                skill,
            });
            this.applyDamage(actor, target, result, skill);
        }
    }

    /** 命中结算（普攻或技能） */
    private resolveHit(actor: BattleEntity, target: BattleEntity, skill: SkillDef | null): void {
        const result = DamageFormula.roll({
            atk: actor.data.stats.atk,
            def: target.effDef,
            crit: actor.data.stats.crit,
            dodge: target.data.stats.dodge,
            skill,
        });
        this.applyDamage(actor, target, result, skill);
    }

    // ============ 伤害结算 ============

    private applyDamage(
        attacker: BattleEntity,
        target: BattleEntity,
        result: DamageResult,
        skill?: SkillDef | null,
    ): void {
        if (!this.inBattle) return;
        if (result.isDodge) {
            // 闪避提示字（深色加粗，避免与背景融合）
            this.spawnFloat(target.pos, '闪', '#1B3A5C', true);
            EventBus.emit(Events.BATTLE_DAMAGE, attacker.data.id, target.data.id, 0, true);
            return;
        }
        // 防御减伤 50%
        let finalDamage = result.damage;
        if (target.defending && finalDamage > 0) {
            finalDamage = Math.max(1, Math.round(finalDamage * 0.5));
        }
        target.hp -= finalDamage;
        target.applyEffects(result);
        // 反震被动（龟息功）
        if (attacker.data.passives.includes('counter') && result.damage > 0 && !attacker.data.isPlayer) {
            attacker.hp -= 3;
        }
        // 自损（狂刀决）
        if (skill?.selfHurt && result.damage > 0) {
            attacker.hp -= attacker.data.stats.maxHp * skill.selfHurt;
        }

        // 特效与飘字（使用最终伤害）
        const targetWorld = target === this.enemy && this.enemyNode ? this.enemyNode.worldPosition
            : target === this.player && this.playerNode ? this.playerNode.worldPosition
            : new Vec3(target.pos.x, target.pos.y, 0);
        if (finalDamage > 0) {
            InkEffects.hit(this.fxRoot!, targetWorld, result.isCrit);
            const color = result.isCrit ? '#8E2B2B' : '#2B2B2B';
            this.spawnFloat(target.pos, `${finalDamage}`, color, result.isCrit);
            if (target === this.enemy) this.enemyStick?.flashHurt();
            else this.playerStick?.flashHurt();
        }
        EventBus.emit(Events.BATTLE_DAMAGE, attacker.data.id, target.data.id, finalDamage, result.isDodge);

        // 死亡判定
        if (target.hp <= 0) {
            target.alive = false;
            EventBus.emit(Events.BATTLE_DEATH, target.data.id);
            if (target === this.enemy) {
                this.enemyStick?.play(StickPose.Dead);
                this.scheduleOnce(() => this.endBattle(true), 0.8);
            } else {
                this.playerStick?.play(StickPose.Dead);
                this.scheduleOnce(() => this.endBattle(false), 0.8);
            }
        }
    }

    // ============ 回合推进 ============

    /** 一个实体行动完毕后，处理下一个或结束回合 */
    private afterActorTurn(didPlayer: boolean): void {
        if (!this.inBattle) return;
        const firstIsPlayer = this.playerFirst;
        if (didPlayer !== firstIsPlayer) {
            // 后手方刚行动完 → 回合结束
            this.endTurn();
        } else {
            // 先手方刚行动完 → 后手方行动
            const next = firstIsPlayer ? this.enemy : this.player;
            if (next && next.alive) {
                this.runActorTurn(next);
            } else {
                this.endTurn();
            }
        }
    }

    private endTurn(): void {
        if (!this.inBattle) return;
        this.turnInProgress = true;
        // 回合结束：回复/冷却递减
        this.player?.tickTurn();
        this.enemy?.tickTurn();
        EventBus.emit(Events.TURN_END, this.turn);
        // 下一回合
        this.turn += 1;
        this.scheduleOnce(() => this.startTurn(), 0.5);
    }

    // ============ 特效与飘字 ============

    private spawnSkillFx(skill: SkillDef, targetPos: { x: number; y: number }, facing: number): void {
        if (!this.fxRoot) return;
        const world = new Vec3(targetPos.x, targetPos.y, 0);
        switch (skill.fx) {
            case 'arrow': InkEffects.arrow(this.fxRoot, world, facing); break;
            case 'wave': InkEffects.wave(this.fxRoot, world); break;
            case 'thrust': InkEffects.thrust(this.fxRoot, world, facing); break;
            case 'smash': InkEffects.smash(this.fxRoot, world); break;
            case 'slash': InkEffects.slash(this.fxRoot, world, facing); break;
        }
    }

    /** 生成飘字（世界层 Label） */
    private spawnFloat(pos: { x: number; y: number }, text: string, color: string, big = false): void {
        if (!this.floatRoot) return;
        const node = new Node('float');
        this.floatRoot.addChild(node);
        node.setPosition(pos.x, pos.y + 40, 0);
        node.addComponent(UITransform);
        const label = node.addComponent(Label);
        label.string = text;
        label.fontSize = big ? 30 : 22;
        label.lineHeight = 32;
        label.color.fromHEX(color);
        label.isBold = big;
        node.setScale(0.6, 0.6, 1);
        node.angle = (Math.random() - 0.5) * 20;
        const op = node.addComponent(UIOpacity);
        op.opacity = 255;
        tween(node)
            .to(0.6, { position: new Vec3(pos.x, pos.y + 70, 0), scale: new Vec3(1, 1, 1) }, { easing: 'quadOut' })
            .start();
        tween(op).delay(0.3).to(0.3, { opacity: 0 }).call(() => node.destroy()).start();
    }

    /** 结束战斗 */
    private endBattle(win: boolean): void {
        if (!this.inBattle) return;
        this.inBattle = false;
        this.awaitingPlayer = false;
        const result: BattleResult = {
            win,
            xp: win ? this.currentXp : 0,
            dropMartial: win ? this.currentDropMartial : undefined,
            dropWeapon: win ? this.currentDropWeapon : undefined,
        };
        EventBus.emit(Events.BATTLE_END, result);
        const cb = this.onEnded;
        this.onEnded = null;
        if (cb) cb(result);
        GameManager.inst.restoreAfterBattle();
    }

    /** 认输/逃跑 */
    surrender(): void {
        if (this.inBattle) this.endBattle(false);
    }

    update(_dt: number): void {
        // 回合制：无每帧逻辑（节点位置由摆位固定）
    }
}
