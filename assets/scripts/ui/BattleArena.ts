import { _decorator, Component, Node, Label, Color, UITransform, Graphics } from 'cc';
import { EventBus, Events } from '../core/EventBus.ts';
import { BattleEntity } from '../combat/BattleEntity.ts';
import { CombatManager, BattleAction } from '../combat/CombatManager.ts';
import { GameManager } from '../core/GameManager.ts';
import { MARTIAL_ARTS } from '../data/MartialArts.ts';
import { SkillDef } from '../data/GameTypes.ts';
import { makeInkLabel, makeInkButton } from './UiKit.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 回合制战斗界面
 * 挂在 UI 层下，默认隐藏。进入战斗时显示：
 * 全屏擂台 + 双方血条/内力 + 回合信息 + 指令面板。
 * 玩家回合弹出指令按钮（普攻/技能/防御/认输），
 * 技能按钮显示冷却回合数。
 */
@ccclass('BattleArena')
export class BattleArena extends Component {
    /** 战斗区域根节点（玩家/敌人节点挂这里） */
    arenaRoot: Node | null = null;
    /** 特效层 / 飘字层（arenaRoot 下） */
    fxRoot: Node | null = null;
    floatRoot: Node | null = null;

    private root: Node | null = null;
    private playerHpFill: Graphics | null = null;
    private enemyHpFill: Graphics | null = null;
    private playerHpLabel: Label | null = null;
    private enemyHpLabel: Label | null = null;
    private playerNameLabel: Label | null = null;
    private enemyNameLabel: Label | null = null;
    private playerMpLabel: Label | null = null;
    private enemyMpLabel: Label | null = null;
    private turnLabel: Label | null = null;
    private promptLabel: Label | null = null;
    private commandRoot: Node | null = null;
    private skillButtons: Node[] = [];

    onLoad(): void {
        this.build();
        this.hide();
        EventBus.on(Events.BATTLE_START, this.onBattleStart, this);
        EventBus.on(Events.BATTLE_DAMAGE, this.onDamage, this);
        EventBus.on(Events.TURN_START, this.onTurnStart, this);
        EventBus.on(Events.PLAYER_TURN, this.onPlayerTurn, this);
        EventBus.on(Events.TURN_END, this.onTurnEnd, this);
        EventBus.on(Events.BATTLE_END, this.onEnd, this);
    }

    onDestroy(): void {
        EventBus.off(Events.BATTLE_START, this.onBattleStart, this);
        EventBus.off(Events.BATTLE_DAMAGE, this.onDamage, this);
        EventBus.off(Events.TURN_START, this.onTurnStart, this);
        EventBus.off(Events.PLAYER_TURN, this.onPlayerTurn, this);
        EventBus.off(Events.TURN_END, this.onTurnEnd, this);
        EventBus.off(Events.BATTLE_END, this.onEnd, this);
    }

    private build(): void {
        const root = new Node('BattleArena');
        this.node.addChild(root);
        this.root = root;

        // ===== 全屏战斗背景（墨色战场氛围）=====
        const bg = root.addComponent(Graphics);
        bg.fillColor.set(28, 24, 20, 240);
        bg.rect(-1000, -700, 2000, 1400);
        bg.fill();
        // 擂台地面（中心椭圆）
        bg.fillColor.set(70, 60, 46, 255);
        bg.ellipse(0, 30, 520, 220);
        bg.fill();
        bg.lineWidth = 4;
        bg.strokeColor.fromHEX('#8F8367');
        bg.ellipse(0, 30, 520, 220);
        bg.stroke();
        // 中心分割线
        bg.lineWidth = 2;
        bg.strokeColor.set(150, 140, 110, 180);
        bg.moveTo(0, -150);
        bg.lineTo(0, 210);
        bg.stroke();

        // ===== 顶部：回合信息 =====
        this.turnLabel = makeInkLabel(root, '— 回合 1 —', { x: 0, y: 320, fontSize: 28, bold: true, color: '#E8C56A', w: 400, h: 40 });

        // ===== 左：玩家血条 =====
        this.playerNameLabel = makeInkLabel(root, '修士', { x: -380, y: 285, fontSize: 22, bold: true, color: '#F0E6CE', w: 300, h: 28 });
        this.playerNameLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
        const pHp = this.makeHpBar(root, -380, 245, true);
        this.playerHpFill = pHp.fill;
        this.playerHpLabel = pHp.label;
        this.playerMpLabel = makeInkLabel(root, '内力 50/50', { x: -380, y: 210, fontSize: 15, color: '#8EB4C8', w: 260, h: 22 });
        this.playerMpLabel.horizontalAlign = Label.HorizontalAlign.LEFT;

        // ===== 右：敌人血条 =====
        this.enemyNameLabel = makeInkLabel(root, '敌人', { x: 380, y: 285, fontSize: 22, bold: true, color: '#E8A0A0', w: 300, h: 28 });
        this.enemyNameLabel.horizontalAlign = Label.HorizontalAlign.RIGHT;
        const eHp = this.makeHpBar(root, 380, 245, false);
        this.enemyHpFill = eHp.fill;
        this.enemyHpLabel = eHp.label;
        this.enemyMpLabel = makeInkLabel(root, '内力 50/50', { x: 380, y: 210, fontSize: 15, color: '#C8A08E', w: 260, h: 22 });
        this.enemyMpLabel.horizontalAlign = Label.HorizontalAlign.RIGHT;

        // ===== 行动提示 =====
        this.promptLabel = makeInkLabel(root, '战斗开始…', { x: 0, y: 140, fontSize: 22, bold: true, color: '#F0E6CE', w: 600, h: 30 });

        // ===== 战斗区域根（玩家/敌人节点挂这里）=====
        this.arenaRoot = new Node('arena');
        root.addChild(this.arenaRoot);
        this.arenaRoot.setPosition(0, 30, 0);
        this.fxRoot = new Node('fx');
        this.arenaRoot.addChild(this.fxRoot);
        this.floatRoot = new Node('float');
        this.arenaRoot.addChild(this.floatRoot);

        // ===== 底部：指令面板 =====
        this.commandRoot = new Node('commands');
        root.addChild(this.commandRoot);
        this.commandRoot.setPosition(0, -170, 0);
        // 指令按钮在 showCommandPanel 时创建
    }

    private makeHpBar(parent: Node, x: number, y: number, isPlayer: boolean): { fill: Graphics; label: Label } {
        const bar = new Node(isPlayer ? 'playerHp' : 'enemyHp');
        parent.addChild(bar);
        bar.setPosition(x, y, 0);
        const bgG = bar.addComponent(Graphics);
        bgG.lineWidth = 2;
        bgG.strokeColor.fromHEX('#C9B896');
        bgG.roundRect(-130, -16, 260, 32, 6);
        bgG.stroke();
        bgG.fillColor.set(40, 34, 28, 235);
        bgG.roundRect(-130, -16, 260, 32, 6);
        bgG.fill();
        const fillNode = new Node('fill');
        bar.addChild(fillNode);
        fillNode.setPosition(-128, 0, 0);
        const fill = fillNode.addComponent(Graphics);
        const label = makeInkLabel(bar, '', { x: 0, y: 0, fontSize: 16, color: '#FFFFFF', w: 256, h: 30 });
        return { fill, label };
    }

    // ===== 事件 =====

    private onBattleStart(player: BattleEntity, enemy: BattleEntity): void {
        this.show();
        if (this.playerNameLabel) this.playerNameLabel.string = player.data.name;
        if (this.enemyNameLabel) this.enemyNameLabel.string = enemy.data.name;
        this.refreshHp(player, enemy);
    }

    private onDamage(_attackerId: string, _targetId: string, _dmg: number, _dodge: boolean): void {
        const cm = CombatManager.inst;
        if (cm && cm.player && cm.enemy) this.refreshHp(cm.player, cm.enemy);
    }

    private onTurnStart(turn: number, playerFirst: boolean): void {
        if (this.turnLabel) this.turnLabel.string = `— 回 合 ${turn} —`;
        const who = playerFirst ? '你' : '敌人';
        if (this.promptLabel) this.promptLabel.string = `【回合 ${turn}】${who}先手`;
        // 非玩家先手时不显示指令（等 ENEMY_TURN 后）
        if (playerFirst) this.showCommandPanel();
    }

    private onPlayerTurn(_turn: number): void {
        this.showCommandPanel();
    }

    private onTurnEnd(turn: number): void {
        if (this.promptLabel) this.promptLabel.string = `回合 ${turn} 结束…`;
        this.clearCommands();
    }

    private onEnd(): void {
        this.clearCommands();
    }

    // ===== 指令面板 =====

    private showCommandPanel(): void {
        if (!this.commandRoot) return;
        this.clearCommands();
        const cm = CombatManager.inst;
        if (!cm.player || !cm.enemy) return;
        const p = cm.player;
        const e = cm.enemy;
        // 回合制：无距离限制，普攻/技能默认可命中

        if (this.promptLabel) {
            this.promptLabel.string = '⚔ 请选择指令';
        }

        // 普攻（使用当前武器的基础武学，无距离/冷却限制）
        const basicName = p.data.basicSkill?.name ?? '普攻';
        makeInkButton(this.commandRoot, `⚔ ${basicName}`, {
            x: -380, y: 0, w: 150, h: 54, fontSize: 18, bold: true,
            bgColor: '#4A3B2A',
            borderColor: '#C9B896',
            textColor: '#F5EAD0',
            onClick: () => cm.playerAct({ type: 'basic' }),
        });

        // 技能 1/2/3
        const skills: (SkillDef | null)[] = [
            p.data.skills[0] ?? null,
            p.data.skills[1] ?? null,
            p.data.skills[2] ?? null,
        ];
        skills.forEach((skill, i) => {
            if (!skill) {
                makeInkButton(this.commandRoot, `技能${i + 1}（未装备）`, {
                    x: -180 + i * 200, y: 0, w: 180, h: 54, fontSize: 16,
                    bgColor: '#2E2A22', borderColor: '#5A5A5A', textColor: '#6A6454',
                });
                return;
            }
            const cd = p.skillCds[skill.id] ?? 0;
            // 可用性只取决于冷却与内力（回合制无距离限制）
            const usable = cd <= 0 && p.mp >= skill.mpCost;
            makeInkButton(this.commandRoot, `${skill.name}${cd > 0 ? ` [CD${cd}]` : ''}`, {
                x: -180 + i * 200, y: 0, w: 180, h: 54, fontSize: 15,
                bgColor: usable ? '#5A4A2A' : '#2E2A22',
                borderColor: usable ? '#E8C56A' : '#5A5A5A',
                textColor: usable ? '#F5EAD0' : '#6A6454',
                onClick: usable ? () => cm.playerAct({ type: 'skill', skill }) : undefined,
            });
            // 技能详情小字（耗内/冷却）
            makeInkLabel(this.commandRoot, `耗内${skill.mpCost}${cd > 0 ? ` 冷却${cd}回合` : ''}`, {
                x: -180 + i * 200, y: -42, fontSize: 12, color: '#8A8474', w: 180, h: 18,
            });
        });

        // 防御 / 认输
        makeInkButton(this.commandRoot, '🛡 防御', {
            x: 440, y: 0, w: 130, h: 54, fontSize: 18,
            bgColor: '#3A4A3A', borderColor: '#8E9A6E', textColor: '#F5EAD0',
            onClick: () => cm.playerAct({ type: 'defend' }),
        });
        makeInkButton(this.commandRoot, '✕ 认输', {
            x: 440, y: -70, w: 130, h: 40, fontSize: 15,
            bgColor: '#5A3030', borderColor: '#C98A8A', textColor: '#F0D8D8',
            onClick: () => cm.surrender(),
        });
    }

    private clearCommands(): void {
        if (this.commandRoot) this.commandRoot.removeAllChildren();
    }

    private refreshHp(player: BattleEntity, enemy: BattleEntity): void {
        const draw = (g: Graphics, cur: number, max: number, w: number, color: string) => {
            g.clear();
            const pct = Math.max(0, cur / max);
            g.fillColor.fromHEX(color);
            g.roundRect(0, -12, w * pct, 24, 4);
            g.fill();
        };
        if (this.playerHpFill) draw(this.playerHpFill, player.hp, player.data.stats.maxHp, 256, '#8E3B3B');
        if (this.enemyHpFill) draw(this.enemyHpFill, enemy.hp, enemy.data.stats.maxHp, 256, '#C0563B');
        if (this.playerHpLabel) this.playerHpLabel.string = `${Math.round(player.hp)} / ${player.data.stats.maxHp}`;
        if (this.enemyHpLabel) this.enemyHpLabel.string = `${Math.round(enemy.hp)} / ${enemy.data.stats.maxHp}`;
        if (this.playerMpLabel) this.playerMpLabel.string = `内力 ${Math.round(player.mp)} / ${player.data.stats.maxMp}`;
        if (this.enemyMpLabel) this.enemyMpLabel.string = `内力 ${Math.round(enemy.mp)} / ${enemy.data.stats.maxMp}`;
    }

    show(): void {
        if (this.root) this.root.active = true;
    }

    hide(): void {
        if (this.root) this.root.active = false;
    }

    get isVisible(): boolean {
        return this.root ? this.root.active : false;
    }
}
