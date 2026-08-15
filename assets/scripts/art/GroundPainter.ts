import { _decorator, Component, Graphics, UITransform } from 'cc';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 俯视大地图地面
 * 挂在 World 容器下（跟随镜头滚动）。
 * 程序化绘制：草地地面、路径、池塘、树木、石头、屋舍，
 * 营造"人在大地上行走"的俯视效果。
 * 尺寸：±mapHalfW × ±mapHalfH
 */
@ccclass('GroundPainter')
export class GroundPainter extends Component {
    mapHalfW: number = 1000;
    mapHalfH: number = 650;

    private gfx: Graphics | null = null;
    private drawn: boolean = false;

    onLoad(): void {
        if (!this.getComponent(UITransform)) this.addComponent(UITransform);
        this.gfx = this.getComponent(Graphics) || this.addComponent(Graphics);
        // 延迟一帧绘制（确保 mapHalfW/H 已被外部设置且 gfx 就绪）
        this.scheduleOnce(() => this.drawOnce(), 0);
    }

    /** 首次进入场景时绘制一次 */
    drawOnce(): void {
        if (this.drawn || !this.gfx) return;
        this.drawn = true;
        const g = this.gfx;
        const W = this.mapHalfW * 2;
        const H = this.mapHalfH * 2;

        // ===== 1. 地面底色（宣纸米黄）=====
        g.fillColor.fromHEX('#E8DFC8');
        g.rect(-this.mapHalfW, -this.mapHalfH, W, H);
        g.fill();

        // ===== 2. 大块草地/泥土色斑 =====
        const patches = [
            { x: -700, y: -400, w: 900, h: 700, c: '#DDD3B6' },
            { x: 300, y: -500, w: 1000, h: 800, c: '#DFD6BA' },
            { x: -900, y: 150, w: 800, h: 600, c: '#D8CEAF' },
            { x: 500, y: 250, w: 700, h: 500, c: '#E3DABF' },
        ];
        for (const p of patches) {
            g.fillColor.fromHEX(p.c);
            g.ellipse(p.x, p.y, p.w / 2, p.h / 2);
            g.fill();
        }

        // ===== 3. 草地笔触纹理（随机小墨点）=====
        let seed = 42;
        const rnd = () => {
            seed = (seed * 16807) % 2147483647;
            return seed / 2147483647;
        };
        g.fillColor.set(140, 130, 100, 60);
        for (let i = 0; i < 900; i++) {
            const x = (rnd() - 0.5) * W;
            const y = (rnd() - 0.5) * H;
            const r = 1 + rnd() * 3;
            g.circle(x, y, r);
            g.fill();
        }
        g.fillColor.set(170, 160, 120, 40);
        for (let i = 0; i < 400; i++) {
            const x = (rnd() - 0.5) * W;
            const y = (rnd() - 0.5) * H;
            g.ellipse(x, y, 8 + rnd() * 20, 4 + rnd() * 8);
            g.fill();
        }

        // ===== 4. 中央广场（圆石板）=====
        g.fillColor.fromHEX('#C9BC98');
        g.circle(0, 0, 130);
        g.fill();
        g.lineWidth = 3;
        g.strokeColor.fromHEX('#8F8367');
        g.circle(0, 0, 130);
        g.stroke();
        // 石板分割线
        for (let i = 0; i < 6; i++) {
            const a = (Math.PI * 2 * i) / 6;
            g.moveTo(Math.cos(a) * 20, Math.sin(a) * 20);
            g.lineTo(Math.cos(a) * 128, Math.sin(a) * 128);
            g.stroke();
        }

        // ===== 5. 土路（从中央广场放射，通向各 NPC）=====
        const roads = [
            { to: { x: 0, y: -120 }, w: 46 },   // 墨虚子
            { to: { x: 280, y: -40 }, w: 42 },  // 李青山
            { to: { x: -300, y: 60 }, w: 42 },  // 醉乞丐
            { to: { x: 520, y: 140 }, w: 40 },  // 峨眉
            { to: { x: -560, y: -160 }, w: 40 },// 武当
            { to: { x: 680, y: -120 }, w: 40 }, // 血影
            { to: { x: -820, y: 180 }, w: 40 }, // 剑圣
            { to: { x: 60, y: 300 }, w: 40 },   // 墨渊
            { to: { x: 0, y: -320 }, w: 48 },   // 塔
        ];
        g.lineWidth = 1;
        g.strokeColor.fromHEX('#C4B48E');
        for (const r of roads) {
            // 画双线土路（外侧浅、内侧深）
            const dx = r.to.x, dy = r.to.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            const ux = dx / len, uy = dy / len;
            g.fillColor.fromHEX('#C4B48E');
            // 用描边粗线模拟土路
            g.lineWidth = r.w;
            g.moveTo(0, 0);
            g.lineTo(r.to.x, r.to.y);
            g.stroke();
            g.lineWidth = r.w * 0.72;
            g.strokeColor.fromHEX('#B3A27C');
            g.moveTo(0, 0);
            g.lineTo(r.to.x, r.to.y);
            g.stroke();
        }

        // ===== 6. 池塘 =====
        g.fillColor.fromHEX('#A8C0C8');
        g.ellipse(-760, -520, 150, 90);
        g.fill();
        g.lineWidth = 4;
        g.strokeColor.fromHEX('#7E9AA4');
        g.ellipse(-760, -520, 150, 90);
        g.stroke();
        // 涟漪
        g.lineWidth = 2;
        g.strokeColor.set(90, 120, 130, 120);
        g.ellipse(-760, -520, 80, 48);
        g.stroke();
        g.ellipse(-760, -520, 40, 24);
        g.stroke();

        // ===== 7. 树木（俯视：圆形树冠 + 阴影）=====
        const trees = [
            { x: -450, y: -350, r: 42 }, { x: 620, y: 320, r: 50 }, { x: -180, y: 420, r: 38 },
            { x: 900, y: -300, r: 46 }, { x: -950, y: -80, r: 44 }, { x: 350, y: 500, r: 40 },
            { x: -600, y: 480, r: 52 }, { x: 850, y: 450, r: 36 }, { x: -350, y: -550, r: 30 },
            { x: 480, y: -450, r: 34 }, { x: -850, y: 400, r: 40 }, { x: 150, y: -560, r: 28 },
        ];
        for (const t of trees) {
            // 阴影
            g.fillColor.set(90, 80, 60, 60);
            g.ellipse(t.x + 6, t.y - 8, t.r, t.r * 0.6);
            g.fill();
            // 树冠（墨绿圆）
            g.fillColor.fromHEX('#5E6B4A');
            g.circle(t.x, t.y, t.r);
            g.fill();
            g.fillColor.set(110, 120, 80, 120);
            g.circle(t.x - t.r * 0.2, t.y + t.r * 0.2, t.r * 0.55);
            g.fill();
        }

        // ===== 8. 石头 =====
        const rocks = [
            { x: 200, y: -180, r: 16 }, { x: -420, y: 180, r: 20 }, { x: 700, y: -40, r: 14 },
            { x: -150, y: -40, r: 12 }, { x: 400, y: 260, r: 18 }, { x: -650, y: -200, r: 15 },
        ];
        for (const r of rocks) {
            g.fillColor.set(120, 115, 100, 200);
            g.circle(r.x, r.y, r.r);
            g.fill();
            g.fillColor.set(160, 155, 135, 160);
            g.circle(r.x - r.r * 0.25, r.y + r.r * 0.25, r.r * 0.5);
            g.fill();
        }

        // ===== 9. 地图边界（墨色描边 + 渐隐）=====
        g.lineWidth = 6;
        g.strokeColor.fromHEX('#7A6F57');
        g.rect(-this.mapHalfW, -this.mapHalfH, W, H);
        g.stroke();
        // 四角晕染
        g.fillColor.set(90, 82, 62, 60);
        g.circle(-this.mapHalfW, -this.mapHalfH, 160);
        g.fill();
        g.circle(this.mapHalfW, -this.mapHalfH, 160);
        g.fill();
        g.circle(-this.mapHalfW, this.mapHalfH, 160);
        g.fill();
        g.circle(this.mapHalfW, this.mapHalfH, 160);
        g.fill();
    }
}
