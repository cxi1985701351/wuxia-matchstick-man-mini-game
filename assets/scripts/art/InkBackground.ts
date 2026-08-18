import { _decorator, Component, Graphics, view, Color, UITransform } from 'cc';

const { ccclass, property } = _decorator;

/**
 * 墨江湖 - 视差远景层
 * 挂在 Canvas 下（不随 World 移动），绘制远山/云雾/太阳/月亮。
 * 通过 worldOffset 轻微反向偏移，营造"人在大地上行走"的纵深感。
 */
@ccclass('InkBackground')
export class InkBackground extends Component {
    @property tone: number = 0.5;
    @property seed: number = 12345;

    /** 视差系数（0=固定，越大偏移越多） */
    parallax: number = 0.25;
    /** 当前世界偏移（由 CameraFollow 提供） */
    worldOffsetX: number = 0;
    worldOffsetY: number = 0;

    private gfx: Graphics | null = null;
    private _rand: () => number = Math.random;
    private drawn: boolean = false;
    private lastX: number = 0;
    private lastY: number = 0;

    onLoad(): void {
        if (!this.getComponent(UITransform)) this.addComponent(UITransform);
        this.gfx = this.getComponent(Graphics) || this.addComponent(Graphics);
        let s = this.seed;
        this._rand = () => {
            s = (s * 16807) % 2147483647;
            return s / 2147483647;
        };
        // 初始绘制一次
        this.redraw();
    }

    /** 更新视差偏移（每帧由 WorldManager 调用） */
    setWorldOffset(x: number, y: number): void {
        this.worldOffsetX = x;
        this.worldOffsetY = y;
        if (Math.abs(x - this.lastX) > 0.5 || Math.abs(y - this.lastY) > 0.5) {
            this.lastX = x;
            this.lastY = y;
            this.redraw();
        }
    }

    /** 设置远景墨色浓度（区域切换时调用） */
    setTone(t: number): void {
        this.tone = t;
        this.redraw();
    }

    private redraw(): void {
        if (!this.gfx) return;
        // 重置随机序列：每次重绘形状一致（确定性远景），仅视差偏移随镜头变化。
        // 原实现每次重绘继续消费随机序列 → 远山/云雾形状每次不同，
        // 玩家移动时背景"闪烁/漂移"，此为该 bug 根因。
        let s = this.seed;
        const rnd = () => {
            s = (s * 16807) % 2147483647;
            return s / 2147483647;
        };
        const g = this.gfx;
        g.clear();
        const w = view.getVisibleSize().width;
        const h = view.getVisibleSize().height;
        // 视差偏移（反向移动，营造远景跟随感）
        const px = this.worldOffsetX * this.parallax;
        const py = this.worldOffsetY * this.parallax;

        // 1. 宣纸底色
        g.fillColor.fromHEX('#F5EFE2');
        g.rect(-w / 2, -h / 2, w, h);
        g.fill();

        // 2. 淡墨晕染
        const inkA = 0.06 + this.tone * 0.05;
        g.fillColor.set(60, 60, 60, Math.round(255 * inkA));
        for (let i = 0; i < 5; i++) {
            const cx = (rnd() - 0.5) * w + px * 0.5;
            const cy = -h / 2 + rnd() * h * 0.3 + py * 0.5;
            const r = h * (0.25 + rnd() * 0.3);
            g.circle(cx, cy, r);
            g.fill();
        }

        // 3. 远山（3 层，视差不同）
        const layers = [
            { base: 0.16 + this.tone * 0.06, y: -h * 0.05 + py * 0.4, amp: h * 0.14, color: '#A8A293', pf: 0.2 },
            { base: 0.12 + this.tone * 0.05, y: -h * 0.12 + py * 0.6, amp: h * 0.18, color: '#8B8678', pf: 0.35 },
            { base: 0.08 + this.tone * 0.04, y: -h * 0.2 + py * 0.8, amp: h * 0.22, color: '#6E6A5E', pf: 0.5 },
        ];
        for (const layer of layers) {
            g.fillColor.fromHEX(layer.color);
            g.moveTo(-w / 2, -h / 2);
            g.lineTo(-w / 2, layer.y);
            const steps = 20;
            for (let i = 0; i <= steps; i++) {
                const pos = -w / 2 + (w * i) / steps;
                const noise = rnd() * 2 - 1;
                const peak = layer.y + Math.sin(i * 0.9 + layer.base * 20) * layer.amp * 0.3 + noise * layer.amp * 0.3;
                g.lineTo(pos, peak);
            }
            g.lineTo(w / 2, -h / 2);
            g.close();
            g.fill();
        }

        // 4. 云雾
        g.fillColor.set(120, 120, 120, 36);
        for (let i = 0; i < 4; i++) {
            const cy = -h * 0.1 + (rnd() - 0.5) * h * 0.5 + py * 0.3;
            const cw = w * (0.3 + rnd() * 0.5);
            const cx = (rnd() - 0.5) * w + px;
            g.ellipse(cx, cy, cw, h * 0.03);
            g.fill();
        }

        // 5. 太阳
        g.fillColor.set(190, 120, 60, 90);
        g.circle(w * 0.3 + px * 0.15, h * 0.32 + py * 0.15, h * 0.06);
        g.fill();
    }
}
