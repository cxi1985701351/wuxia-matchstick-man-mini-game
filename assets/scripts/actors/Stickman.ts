import { _decorator, Component, Graphics, UITransform, Vec3 } from 'cc';
import { WeaponType } from '../data/GameTypes.ts';

const { ccclass, property } = _decorator;

/** 火柴人动画状态 */
export enum StickPose {
    Idle = 'idle',
    Run = 'run',
    Attack = 'attack',
    Hurt = 'hurt',
    Dead = 'dead',
    Cast = 'cast',
}

/**
 * 墨江湖 - 程序化水墨火柴人（建模 v2）
 * 关节化骨骼：肩→肘→手 / 髋→膝→脚 两段式四肢 + 关节墨点，
 * 躯干 S 形笔锋曲线 + 肩线，墨点头颅（发髻+束冠）。
 * 武器精绘：剑（脊刃/剑格/剑柄/剑穗）、弓（双弧/弦/搭箭）、琴（五弦/岳山/琴轸）、
 * 刀（弯刃/刀背/刀镡）、枪（菱形枪头/红缨）、伞（合伞斜持/开伞前刺）、拳（拳套护腕）。
 */
@ccclass('Stickman')
export class Stickman extends Component {
    @property weapon: WeaponType = WeaponType.Sword;
    @property inkTone: number = 0.45;      // 0=浅灰 1=浓墨
    @property scale: number = 1.0;

    pose: StickPose = StickPose.Idle;
    /** 动画时间累积 */
    private t: number = 0;
    private gfx: Graphics | null = null;
    /** 受击闪烁 */
    private hurtFlash: number = 0;
    /** 面向：1右 -1左 */
    facing: number = 1;

    onLoad(): void {
        // Graphics 在 3.x 需要 UITransform 才能渲染
        if (!this.getComponent(UITransform)) this.addComponent(UITransform);
        this.gfx = this.getComponent(Graphics) || this.addComponent(Graphics);
    }

    /** 切换姿态并重置动画时间（攻击用） */
    play(pose: StickPose, duration?: number): void {
        this.pose = pose;
        this.t = 0;
        if (pose === StickPose.Attack || pose === StickPose.Cast) {
            this.scheduleOnce(() => {
                if (this.pose === pose) this.pose = StickPose.Idle;
            }, duration ?? 0.3);
        }
    }

    flashHurt(): void {
        this.hurtFlash = 0.15;
    }

    update(dt: number): void {
        this.t += dt;
        if (this.hurtFlash > 0) this.hurtFlash -= dt;
        this.draw();
    }

    /** 颜色：墨色或受击红色 */
    private get color(): { r: number; g: number; b: number; a: number } {
        const base = Math.round(70 + (1 - this.inkTone) * 120); // 70~190
        if (this.hurtFlash > 0) return { r: 200, g: 40, b: 40, a: 255 };
        return { r: base, g: base, b: base, a: 255 };
    }

    private draw(): void {
        if (!this.gfx) return;
        const g = this.gfx;
        g.clear();
        const c = this.color;
        const hex = this.toHex(c);

        // 脚下墨影（俯视地图上"站在地面"的投影）
        g.fillColor.set(70, 62, 46, 70);
        g.ellipse(0, -2, 20 * this.scale, 8 * this.scale);
        g.fill();

        const s = 34 * this.scale;      // 半身长基准
        const w = 22 * this.scale;      // 半肩宽
        const f = this.facing;
        const phase = this.t;

        // 各关节位置（局部坐标，脚在原点附近，头朝上）
        let hipY = 0, hipX = 0;
        let shoulderY = 0, shoulderX = 0;
        let headY = 0;
        let armSwing = 0, legSwing = 0;
        let bodyLean = 0;
        let armAttack = 0;   // 攻击时手臂前伸
        let armCast = 0;     // 施法时双手张开

        switch (this.pose) {
            case StickPose.Idle:
                hipY = 0; shoulderY = 26 * this.scale; headY = 44 * this.scale;
                armSwing = Math.sin(phase * 2) * 2;
                bodyLean = Math.sin(phase * 2) * 1.5;
                break;
            case StickPose.Run:
                hipY = 0; shoulderY = 26 * this.scale; headY = 44 * this.scale;
                armSwing = Math.sin(phase * 14) * 16;
                legSwing = Math.sin(phase * 14) * 12;
                bodyLean = 6;
                break;
            case StickPose.Attack:
                hipY = 0; shoulderY = 26 * this.scale; headY = 44 * this.scale;
                armAttack = this.attackEase();
                bodyLean = 8 * f;
                break;
            case StickPose.Cast:
                hipY = 0; shoulderY = 26 * this.scale; headY = 44 * this.scale;
                armCast = Math.sin(phase * 8) * 8;
                break;
            case StickPose.Hurt:
                hipY = -2; shoulderY = 22 * this.scale; headY = 40 * this.scale;
                bodyLean = -10;
                break;
            case StickPose.Dead:
                hipY = -4; shoulderY = 18 * this.scale; headY = 30 * this.scale;
                bodyLean = -24;
                break;
        }

        // 肩/髋
        const sx = shoulderX + bodyLean * f;
        const sy = shoulderY;
        const hx = hipX;
        const hy = hipY;

        // ===== 后腿（先画，视觉上靠后） =====
        const legL = 22 * this.scale;
        const stride = this.pose === StickPose.Run ? legSwing * f * 0.5
            : this.pose === StickPose.Attack ? 7 * f : 0;
        const backFootX = hx - w * 0.6 + stride * 0.6;
        const backFootY = -legL;
        const backKneeX = hx + (backFootX - hx) * 0.5 - 2.5 * f;
        const backKneeY = (hy + backFootY) * 0.5 + 1.5;
        g.lineWidth = 2.2 * this.scale;
        g.strokeColor.fromHEX(hex);
        g.moveTo(hx, hy);
        g.lineTo(backKneeX, backKneeY);
        g.lineTo(backFootX, backFootY);
        g.stroke();

        // ===== 后手 =====
        const backX = sx - w * 0.85 * f + armSwing * f * 0.4;
        const backY = sy - 4 - armSwing * 0.3;
        const backElbowX = sx + (backX - sx) * 0.5 - 2 * f;
        const backElbowY = sy + (backY - sy) * 0.5 - 3.5;
        g.moveTo(sx, sy);
        g.lineTo(backElbowX, backElbowY);
        g.lineTo(backX, backY);
        g.stroke();

        // ===== 躯干（S 形笔锋曲线 + 肩线） =====
        g.lineWidth = 3 * this.scale;
        g.moveTo(sx, sy);
        g.quadraticCurveTo(sx + bodyLean * f * 0.25, (sy + hy) * 0.5 + 2, hx, hy);
        g.stroke();
        // 肩线（垂直于躯干方向，微微倾斜）
        g.lineWidth = 2.4 * this.scale;
        g.moveTo(sx - 6.5 * this.scale, sy + 1.5);
        g.lineTo(sx + 6.5 * this.scale, sy - 1.5);
        g.stroke();

        // ===== 头（墨点圆 + 发髻 + 束冠） =====
        const headR = 6.5 * this.scale;
        const hxr = hx + bodyLean * f * 0.6;
        const hyr = headY;
        g.lineWidth = 2.2 * this.scale;
        g.circle(hxr, hyr, headR);
        g.stroke();
        // 发髻（修仙特征）
        g.moveTo(hxr, hyr + headR);
        g.lineTo(hxr, hyr + headR + 4.5 * this.scale);
        g.stroke();
        // 束冠（横笔）
        g.lineWidth = 1.8 * this.scale;
        g.moveTo(hxr - 3 * this.scale, hyr + headR + 1.5);
        g.lineTo(hxr + 3 * this.scale, hyr + headR + 1.5);
        g.stroke();

        // ===== 前腿（弓步/奔跑前跨） =====
        const frontFootX = hx + w * 0.6 - stride * 0.6;
        const frontFootY = -legL;
        const frontKneeX = hx + (frontFootX - hx) * 0.5 + 2.5 * f;
        const frontKneeY = (hy + frontFootY) * 0.5 + 1.5;
        g.lineWidth = 2.2 * this.scale;
        g.moveTo(hx, hy);
        g.lineTo(frontKneeX, frontKneeY);
        g.lineTo(frontFootX, frontFootY);
        g.stroke();

        // ===== 前手（持武器） =====
        const armL = 18 * this.scale;
        const weaponHandX = sx + w * 0.9 * f + armAttack * f;
        const weaponHandY = sy - 4 + (this.pose === StickPose.Cast ? armCast : 0);
        const frontElbowX = sx + (weaponHandX - sx) * 0.5 + 2 * f;
        const frontElbowY = sy + (weaponHandY - sy) * 0.5 - 3.5;
        g.moveTo(sx, sy);
        g.lineTo(frontElbowX, frontElbowY);
        g.lineTo(weaponHandX, weaponHandY);
        g.stroke();

        // ===== 关节墨点（肘/膝） =====
        g.fillColor.fromHEX(hex);
        g.circle(frontElbowX, frontElbowY, 2 * this.scale);
        g.fill();
        g.circle(backElbowX, backElbowY, 2 * this.scale);
        g.fill();
        g.circle(frontKneeX, frontKneeY, 2 * this.scale);
        g.fill();
        g.circle(backKneeX, backKneeY, 2 * this.scale);
        g.fill();

        // ===== 武器 =====
        this.drawWeapon(g, weaponHandX, weaponHandY);
    }

    /** 攻击动画：前 40% 前伸，之后回收 */
    private attackEase(): number {
        const dur = 0.25;
        const p = Math.min(1, this.t / dur);
        if (p < 0.4) return p / 0.4 * 22 * this.scale;
        return (1 - (p - 0.4) / 0.6) * 22 * this.scale;
    }

    /** 武器精绘（v2：脊线/剑格/剑穗、双弧弓、五弦琴、刀背、菱形枪头红缨、伞开合、拳套） */
    private drawWeapon(g: Graphics, x: number, y: number): void {
        const f = this.facing;
        const sc = this.scale;
        const pose = this.pose;
        switch (this.weapon) {
            case WeaponType.Sword: {
                // 剑：刃线 + 剑脊 + 剑格 + 剑柄 + 剑穗
                const angle = pose === StickPose.Attack ? -0.35 * f : 0;
                const len = 30 * sc;
                const ex = x + Math.cos(angle) * len * f;
                const ey = y - Math.sin(angle) * len * 0.6;
                g.lineWidth = 2.2 * sc;
                g.strokeColor.set(60, 60, 60, 255);
                g.moveTo(x, y); g.lineTo(ex, ey); g.stroke();
                // 剑脊（细线）
                g.lineWidth = 1 * sc;
                g.moveTo(x - 1.6 * f * sc, y + 1.6 * sc);
                g.lineTo(ex - 1.6 * f * sc, ey + 1.6 * sc);
                g.stroke();
                // 剑尖
                g.moveTo(ex, ey); g.lineTo(ex + 3.5 * f * sc, ey + 2 * sc); g.stroke();
                // 剑格
                g.lineWidth = 2 * sc;
                g.moveTo(x - 4.5 * f * sc, y - 3 * sc); g.lineTo(x - 4.5 * f * sc, y + 3 * sc); g.stroke();
                // 剑柄
                g.lineWidth = 1.8 * sc;
                g.moveTo(x, y); g.lineTo(x - 8 * f * sc, y); g.stroke();
                // 剑穗
                g.lineWidth = 1.2 * sc;
                g.moveTo(x - 8 * f * sc, y);
                g.quadraticCurveTo(x - 12 * f * sc, y - 3 * sc, x - 13 * f * sc, y + 4 * sc);
                g.stroke();
                break;
            }
            case WeaponType.Bow: {
                // 弓：上下双弧弓臂 + 弦；攻击时搭箭
                const midX = x + 10 * f * sc;
                g.lineWidth = 2 * sc;
                g.strokeColor.set(60, 60, 60, 255);
                g.moveTo(x - 7 * sc, y);
                g.quadraticCurveTo(midX, y + 17 * sc, x + 21 * sc, y);
                g.stroke();
                g.moveTo(x - 7 * sc, y);
                g.quadraticCurveTo(midX, y - 15 * sc, x + 21 * sc, y);
                g.stroke();
                // 弦
                g.lineWidth = 1 * sc;
                g.moveTo(x - 7 * sc, y); g.lineTo(x + 21 * sc, y); g.stroke();
                // 搭箭（攻击时）
                if (pose === StickPose.Attack) {
                    g.lineWidth = 1.5 * sc;
                    g.moveTo(x - 4 * sc, y + 1 * sc); g.lineTo(x + 32 * f * sc, y + 1 * sc); g.stroke();
                    g.moveTo(x + 32 * f * sc, y + 1 * sc);
                    g.lineTo(x + 38 * f * sc, y - 1 * sc);
                    g.lineTo(x + 38 * f * sc, y + 3 * sc);
                    g.close();
                    g.stroke();
                }
                break;
            }
            case WeaponType.Guqin: {
                // 琴：圆角琴身 + 五弦 + 岳山 + 琴轸
                const w = 24 * sc, h = 9 * sc;
                g.lineWidth = 2 * sc;
                g.strokeColor.set(60, 60, 60, 255);
                g.roundRect(x, y - h / 2, w * f, h, 2.5 * sc);
                g.stroke();
                g.lineWidth = 1 * sc;
                for (let i = 1; i < 6; i++) {
                    g.moveTo(x + (w * f) * i / 6, y - h / 2);
                    g.lineTo(x + (w * f) * i / 6, y + h / 2);
                    g.stroke();
                }
                // 岳山（两端横线）
                g.moveTo(x + 1.5 * sc, y - h / 2); g.lineTo(x + 1.5 * sc, y + h / 2); g.stroke();
                g.moveTo(x + w * f - 1.5 * sc, y - h / 2); g.lineTo(x + w * f - 1.5 * sc, y + h / 2); g.stroke();
                // 琴轸（尾部小钩）
                g.moveTo(x + w * f * 0.5, y + h / 2);
                g.lineTo(x + w * f * 0.5, y + h / 2 + 3 * sc);
                g.stroke();
                break;
            }
            case WeaponType.Blade: {
                // 刀：弯刃 + 刀背线 + 刀镡 + 刀柄
                const len = 30 * sc;
                g.lineWidth = 2.4 * sc;
                g.strokeColor.set(60, 60, 60, 255);
                g.moveTo(x, y);
                g.quadraticCurveTo(x + len * f * 0.5, y + 7 * sc, x + len * f, y - 2 * sc);
                g.stroke();
                // 刀背
                g.lineWidth = 1 * sc;
                g.moveTo(x, y - 2.5 * sc);
                g.quadraticCurveTo(x + len * f * 0.5, y + 4 * sc, x + len * f * 0.98, y - 4.5 * sc);
                g.stroke();
                // 刀镡
                g.lineWidth = 2 * sc;
                g.moveTo(x - 3 * f * sc, y - 4 * sc); g.lineTo(x - 3 * f * sc, y + 4 * sc); g.stroke();
                // 刀柄 + 尾环
                g.lineWidth = 1.8 * sc;
                g.moveTo(x, y); g.lineTo(x - 8 * f * sc, y); g.stroke();
                g.moveTo(x - 8 * f * sc, y - 2 * sc); g.lineTo(x - 8 * f * sc, y + 2 * sc); g.stroke();
                break;
            }
            case WeaponType.Spear: {
                // 枪：长杆 + 菱形枪头 + 红缨
                g.lineWidth = 2 * sc;
                g.strokeColor.set(60, 60, 60, 255);
                g.moveTo(x - 18 * sc, y + 4 * sc);
                g.lineTo(x + 30 * f * sc, y - 3 * sc);
                g.stroke();
                const tx = x + 30 * f * sc, ty = y - 3 * sc;
                // 菱形枪头
                g.moveTo(tx, ty);
                g.lineTo(tx + 10 * f * sc, ty);
                g.lineTo(tx + 14 * f * sc, ty - 4 * sc);
                g.lineTo(tx + 14 * f * sc, ty + 4 * sc);
                g.lineTo(tx + 10 * f * sc, ty);
                g.stroke();
                // 红缨（三短笔）
                g.lineWidth = 1.5 * sc;
                g.moveTo(tx, ty); g.lineTo(tx - 3 * f * sc, ty + 6 * sc); g.stroke();
                g.moveTo(tx, ty); g.lineTo(tx - 6 * f * sc, ty + 4 * sc); g.stroke();
                g.moveTo(tx, ty); g.lineTo(tx - 1 * f * sc, ty + 7 * sc); g.stroke();
                break;
            }
            case WeaponType.Umbrella: {
                // 伞：攻击=开伞扇形前刺；平时=合伞斜持
                if (pose === StickPose.Attack) {
                    g.lineWidth = 2 * sc;
                    g.strokeColor.set(60, 60, 60, 255);
                    // 伞面（扇形轮廓）
                    g.moveTo(x, y);
                    g.quadraticCurveTo(x + 8 * f * sc, y + 24 * sc, x + 26 * f * sc, y + 24 * sc);
                    g.lineTo(x + 30 * f * sc, y);
                    g.stroke();
                    // 伞骨
                    g.moveTo(x, y); g.lineTo(x + 12 * f * sc, y + 22 * sc); g.stroke();
                    g.moveTo(x, y); g.lineTo(x + 24 * f * sc, y + 14 * sc); g.stroke();
                    // 伞尖
                    g.moveTo(x + 26 * f * sc, y + 24 * sc); g.lineTo(x + 28 * f * sc, y + 28 * sc); g.stroke();
                } else {
                    // 合伞：斜杆 + 伞头弯钩 + 收拢伞面
                    g.lineWidth = 2 * sc;
                    g.strokeColor.set(60, 60, 60, 255);
                    g.moveTo(x - 4 * sc, y + 2 * sc);
                    g.lineTo(x + 22 * f * sc, y + 18 * sc);
                    g.stroke();
                    // 伞头弯钩
                    g.lineWidth = 2.4 * sc;
                    g.moveTo(x + 22 * f * sc, y + 18 * sc);
                    g.lineTo(x + 26 * f * sc, y + 24 * sc);
                    g.stroke();
                    g.moveTo(x + 26 * f * sc, y + 24 * sc);
                    g.quadraticCurveTo(x + 33 * f * sc, y + 28 * sc, x + 29 * f * sc, y + 32 * sc);
                    g.stroke();
                    // 收拢伞面（两道斜短线）
                    g.lineWidth = 1.4 * sc;
                    g.moveTo(x + 12 * f * sc, y + 10 * sc); g.lineTo(x + 10 * f * sc, y + 14 * sc); g.stroke();
                    g.moveTo(x + 16 * f * sc, y + 13 * sc); g.lineTo(x + 14 * f * sc, y + 17 * sc); g.stroke();
                }
                break;
            }
            case WeaponType.Fist: {
                // 拳：握拳圆 + 护腕
                g.lineWidth = 2 * sc;
                g.strokeColor.set(60, 60, 60, 255);
                g.circle(x + 4 * f * sc, y, 4.5 * sc);
                g.stroke();
                // 护腕（两道）
                g.lineWidth = 1.8 * sc;
                g.moveTo(x - 1 * f * sc, y - 3 * sc); g.lineTo(x - 1 * f * sc, y + 3 * sc); g.stroke();
                g.moveTo(x - 5 * f * sc, y - 2.5 * sc); g.lineTo(x - 5 * f * sc, y + 2.5 * sc); g.stroke();
                break;
            }
        }
    }

    private toHex(c: { r: number; g: number; b: number; a: number }): string {
        return '#' + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('');
    }
}
