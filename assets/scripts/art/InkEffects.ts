import { _decorator, Component, Graphics, Node, Vec3, tween, UIOpacity } from 'cc';
import { WeaponType } from '../data/GameTypes.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 墨迹特效工厂
 * 静态方法，在指定节点位置生成一次性墨迹特效（剑气/箭/音波/墨渍/拖影）。
 * 特效节点自动淡出销毁。
 */
@ccclass('InkEffects')
export class InkEffects extends Component {
    /** 挥砍弧线（剑） */
    static slash(parent: Node, worldPos: Vec3, facing: number, color = '#2B2B2B'): void {
        InkEffects.make(parent, worldPos, (g) => {
            g.lineWidth = 4;
            g.strokeColor.fromHEX(color);
            const r = 46;
            g.arc(0, 0, r, facing > 0 ? -1.2 : 0.8, facing > 0 ? 0.6 : 2.6, facing < 0);
            g.stroke();
        }, 0.22);
    }

    /** 箭矢（弓） */
    static arrow(parent: Node, worldPos: Vec3, facing: number): void {
        InkEffects.make(parent, worldPos, (g) => {
            g.lineWidth = 2.5;
            g.strokeColor.fromHEX('#2B2B2B');
            g.moveTo(-16, 0); g.lineTo(12, 0); g.stroke();
            g.moveTo(12, 0); g.lineTo(6, -4); g.lineTo(8, 0); g.lineTo(6, 4); g.lineTo(12, 0); g.stroke();
        }, 0.3, facing);
    }

    /** 音波（琴） */
    static wave(parent: Node, worldPos: Vec3): void {
        InkEffects.make(parent, worldPos, (g) => {
            g.lineWidth = 3;
            g.strokeColor.fromHEX('#2B2B2B');
            for (let i = 1; i <= 3; i++) {
                g.circle(0, 0, 14 * i);
                g.stroke();
            }
        }, 0.35);
    }

    /** 枪刺（枪） */
    static thrust(parent: Node, worldPos: Vec3, facing: number): void {
        InkEffects.make(parent, worldPos, (g) => {
            g.lineWidth = 3.5;
            g.strokeColor.fromHEX('#2B2B2B');
            g.moveTo(-facing * 26, 0); g.lineTo(facing * 8, 0); g.stroke();
            g.moveTo(facing * 8, 0); g.lineTo(facing * 20, -4); g.lineTo(facing * 20, 4); g.close(); g.stroke();
        }, 0.2, facing);
    }

    /** 重击（刀） */
    static smash(parent: Node, worldPos: Vec3): void {
        InkEffects.make(parent, worldPos, (g) => {
            g.lineWidth = 5;
            g.strokeColor.fromHEX('#2B2B2B');
            g.moveTo(-20, 8); g.lineTo(0, 0); g.lineTo(-16, -10); g.stroke();
            g.moveTo(10, 14); g.lineTo(0, 0); g.lineTo(14, -8); g.stroke();
        }, 0.25);
    }

    /** 旋伞弧（伞） */
    static spin(parent: Node, worldPos: Vec3, facing: number): void {
        InkEffects.make(parent, worldPos, (g) => {
            g.lineWidth = 3.5;
            g.strokeColor.fromHEX('#2B2B2B');
            // 双道旋转圆弧（伞面开合）
            g.arc(0, 0, 34, facing > 0 ? -1.0 : 1.0, facing > 0 ? 1.0 : 3.0, facing < 0);
            g.stroke();
            g.arc(0, 0, 22, facing > 0 ? 2.2 : 0.9, facing > 0 ? 3.8 : 2.5, facing < 0);
            g.stroke();
            // 伞骨短线
            g.moveTo(0, 0); g.lineTo(30 * facing, -6); g.stroke();
            g.moveTo(0, 0); g.lineTo(-18 * facing, -22); g.stroke();
        }, 0.3, facing);
    }

    /** 拳风（拳） */
    static punch(parent: Node, worldPos: Vec3, facing: number): void {
        InkEffects.make(parent, worldPos, (g) => {
            g.lineWidth = 3;
            g.strokeColor.fromHEX('#2B2B2B');
            // 拳风短弧线（破空）
            g.arc(facing * 18, 0, 14, -0.9, 0.9, false);
            g.stroke();
            g.arc(facing * 32, 0, 9, -0.8, 0.8, false);
            g.stroke();
            // 破空短线
            g.moveTo(facing * 42, -6); g.lineTo(facing * 54, -2); g.stroke();
            g.moveTo(facing * 42, 6); g.lineTo(facing * 54, 2); g.stroke();
        }, 0.22, facing);
    }

    /** 命中墨渍爆开 */
    static hit(parent: Node, worldPos: Vec3, isCrit: boolean): void {
        InkEffects.make(parent, worldPos, (g) => {
            const color = isCrit ? '#8E2B2B' : '#3A3A3A';
            g.fillColor.fromHEX(color);
            const n = isCrit ? 10 : 6;
            for (let i = 0; i < n; i++) {
                const a = (Math.PI * 2 * i) / n + Math.random() * 0.5;
                const r = 4 + Math.random() * 6;
                const d = 10 + Math.random() * 14;
                g.circle(Math.cos(a) * d, Math.sin(a) * d, r);
                g.fill();
            }
            g.circle(0, 0, 7);
            g.fill();
        }, 0.3);
    }

    /** 冲刺拖影 */
    static dash(parent: Node, from: Vec3, to: Vec3): void {
        InkEffects.make(parent, from, (g) => {
            g.lineWidth = 6;
            g.strokeColor.set(60, 60, 60, 120);
            g.moveTo(0, 0);
            g.lineTo(to.x - from.x, to.y - from.y);
            g.stroke();
        }, 0.18);
    }

    /** 生成特效节点（内部） */
    private static make(
        parent: Node,
        worldPos: Vec3,
        draw: (g: Graphics) => void,
        life: number,
        flipX = 1,
    ): void {
        const node = new Node('ink-fx');
        parent.addChild(node);
        node.setWorldPosition(worldPos);
        node.setScale(flipX, 1, 1);
        const g = node.addComponent(Graphics);
        draw(g);
        const op = node.addComponent(UIOpacity);
        op.opacity = 255;
        tween(op)
            .delay(life * 0.6)
            .to(life * 0.4, { opacity: 0 })
            .call(() => node.destroy())
            .start();
    }
}
