import { _decorator, Component, Node, Vec3, input, Input, EventKeyboard, KeyCode, EventMouse, math } from 'cc';
import { GameManager } from '../core/GameManager.ts';
import { BattleEntity, Vec2 } from '../combat/BattleEntity.ts';
import { CombatManager } from '../combat/CombatManager.ts';
import { Stickman, StickPose } from './Stickman.ts';
import { InkEffects } from '../art/InkEffects.ts';
import { MARTIAL_ARTS } from '../data/MartialArts.ts';
import { SkillDef } from '../data/GameTypes.ts';
import { EventBus, Events } from '../core/EventBus.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 玩家控制器
 * WASD 移动；J/左键 普攻；K/空格 冲刺；1/2/3 武功。
 * 移动时切换火柴人 Run 姿态，攻击时 Attack/Cast 姿态。
 */
@ccclass('PlayerController')
export class PlayerController extends Component {
    private keys: Record<string, boolean> = {};
    private stickman: Stickman | null = null;
    private moveDir: Vec2 = { x: 0, y: 0 };
    private attackTimer: number = 0;
    private dashTimer: number = 0;
    private dashDir: Vec2 = { x: 0, y: 0 };
    /** 是否在战斗模式（可攻击） */
    inBattle: boolean = false;

    onLoad(): void {
        this.stickman = this.getComponent(Stickman) || this.node.getComponentInChildren(Stickman);
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
    }

    onDestroy(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
    }

    private onKeyDown(e: EventKeyboard): void {
        this.keys[e.keyCode] = true;
        // 回合制：战斗中的行动由指令面板（按钮）操作，键盘仅用于大世界移动
        if (e.keyCode === KeyCode.KEY_J) this.tryAttack();
        if (e.keyCode === KeyCode.SPACE || e.keyCode === KeyCode.KEY_K) this.tryDash();
    }

    private onKeyUp(e: EventKeyboard): void {
        this.keys[e.keyCode] = false;
    }

    private onMouseDown(e: EventMouse): void {
        if (e.getButton() === EventMouse.BUTTON_LEFT) this.tryAttack();
    }

    /** 攻击（仅大世界演示用；战斗中走回合制指令面板） */
    private get attackCd(): number {
        const stats = GameManager.inst.stats;
        return stats ? 1.0 / stats.atkSpd : 1.0;
    }

    tryAttack(): void {
        // 战斗中不响应即时攻击（回合制）
        if (this.inBattle) return;
        if (this.attackTimer > 0) return;
        this.attackTimer = this.attackCd;
        this.stickman?.play(StickPose.Attack, 0.25);
    }

    tryDash(): void {
        if (this.inBattle) return;
        if (this.dashTimer > 0) return;
        const gm = GameManager.inst;
        const hasDash = gm.state.equipped.qinggong
            ? (MARTIAL_ARTS[gm.state.equipped.qinggong].passives?.includes('dash') ?? false)
            : false;
        if (!hasDash) return;
        this.dashTimer = gm.stats ? gm.stats.dashCd : 1.5;
        this.dashDir = { x: this.moveDir.x, y: this.moveDir.y };
        if (this.dashDir.x === 0 && this.dashDir.y === 0) this.dashDir = { x: this.stickman?.facing ?? 1, y: 0 };
        const from = this.node.position.clone();
        const spd = gm.stats?.spd ?? 220;
        this.node.setPosition(
            this.node.position.x + this.dashDir.x * spd * 0.3,
            this.node.position.y + this.dashDir.y * spd * 0.3,
            0,
        );
        InkEffects.dash(this.node.parent!, from, this.node.position);
    }

    update(dt: number): void {
        if (this.attackTimer > 0) this.attackTimer -= dt;
        if (this.dashTimer > 0) this.dashTimer -= dt;

        // 战斗中：不移动（回合制站位固定）
        if (this.inBattle) return;

        // 输入方向
        let dx = 0, dy = 0;
        if (this.keys[KeyCode.KEY_A] || this.keys[KeyCode.ARROW_LEFT]) dx -= 1;
        if (this.keys[KeyCode.KEY_D] || this.keys[KeyCode.ARROW_RIGHT]) dx += 1;
        if (this.keys[KeyCode.KEY_W] || this.keys[KeyCode.ARROW_UP]) dy += 1;
        if (this.keys[KeyCode.KEY_S] || this.keys[KeyCode.ARROW_DOWN]) dy -= 1;
        this.moveDir = { x: dx, y: dy };

        const gm = GameManager.inst;
        const stats = gm.stats;
        if (!stats) return;

        // 冲刺位移
        if (this.dashTimer > 0 && this.dashTimer > stats.dashCd - 0.15) {
            const dashSpeed = stats.spd * 2.2;
            this.node.setPosition(
                this.node.position.x + this.dashDir.x * dashSpeed * dt,
                this.node.position.y + this.dashDir.y * dashSpeed * dt,
                0,
            );
        } else if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            const spd = stats.spd * (this.inBattle ? 1 : 1);
            this.node.setPosition(
                this.node.position.x + (dx / len) * spd * dt,
                this.node.position.y + (dy / len) * spd * dt,
                0,
            );
            if (dx !== 0 && this.stickman) this.stickman.facing = dx > 0 ? 1 : -1;
            if (this.stickman && this.stickman.pose !== StickPose.Attack && this.stickman.pose !== StickPose.Cast) {
                this.stickman.play(StickPose.Run);
            }
        } else if (this.stickman && this.stickman.pose === StickPose.Run) {
            this.stickman.play(StickPose.Idle);
        }
    }
}
