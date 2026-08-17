import { _decorator, Component, Graphics, UITransform } from 'cc';
import { RegionDef } from '../data/GameTypes.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 俯视地面（区域制）
 * 挂在 World 容器下（跟随镜头滚动）。
 * draw(region) 按区域样式重绘：底色 + 笔触纹理 + 分区要素 + 边界。
 * 样式：village 田园 / hub 石板放射 / town 市集方砖 / sect 青石庭院。
 */
@ccclass('GroundPainter')
export class GroundPainter extends Component {
    mapHalfW: number = 600;
    mapHalfH: number = 450;

    private gfx: Graphics | null = null;

    onLoad(): void {
        if (!this.getComponent(UITransform)) this.addComponent(UITransform);
        this.gfx = this.getComponent(Graphics) || this.addComponent(Graphics);
    }

    /** 按区域重绘地面（区域切换时调用） */
    draw(region: RegionDef): void {
        if (!this.gfx) return;
        const g = this.gfx;
        this.mapHalfW = region.halfW;
        this.mapHalfH = region.halfH;
        g.clear();
        const W = region.halfW * 2;
        const H = region.halfH * 2;

        // 1. 宣纸米黄底色
        g.fillColor.fromHEX('#E8DFC8');
        g.rect(-region.halfW, -region.halfH, W, H);
        g.fill();

        // 2. 墨点/草色笔触纹理
        this.drawInkTexture(g, region);

        // 3. 区域样式
        switch (region.ground) {
            case 'village': this.drawVillage(g, region); break;
            case 'hub': this.drawHub(g, region); break;
            case 'town': this.drawTown(g, region); break;
            case 'sect': this.drawSect(g, region); break;
        }

        // 4. 边界
        this.drawBorder(g, region);
    }

    // ============ 通用 ============

    private drawInkTexture(g: Graphics, r: RegionDef): void {
        let seed = 42;
        const rnd = () => {
            seed = (seed * 16807) % 2147483647;
            return seed / 2147483647;
        };
        const area = r.halfW * r.halfH / (1000 * 650);
        g.fillColor.set(140, 130, 100, 60);
        const dots = Math.round(700 * area);
        for (let i = 0; i < dots; i++) {
            const x = (rnd() - 0.5) * r.halfW * 2;
            const y = (rnd() - 0.5) * r.halfH * 2;
            g.circle(x, y, 1 + rnd() * 3);
            g.fill();
        }
        g.fillColor.set(170, 160, 120, 40);
        const grass = Math.round(300 * area);
        for (let i = 0; i < grass; i++) {
            const x = (rnd() - 0.5) * r.halfW * 2;
            const y = (rnd() - 0.5) * r.halfH * 2;
            g.ellipse(x, y, 8 + rnd() * 20, 4 + rnd() * 8);
            g.fill();
        }
    }

    private drawTrees(g: Graphics, r: RegionDef, list: { x: number; y: number; r: number }[]): void {
        for (const t of list) {
            g.fillColor.set(90, 80, 60, 60);
            g.ellipse(t.x + 6, t.y - 8, t.r, t.r * 0.6);
            g.fill();
            g.fillColor.fromHEX('#5E6B4A');
            g.circle(t.x, t.y, t.r);
            g.fill();
            g.fillColor.set(110, 120, 80, 120);
            g.circle(t.x - t.r * 0.2, t.y + t.r * 0.2, t.r * 0.55);
            g.fill();
        }
    }

    private drawRocks(g: Graphics, r: RegionDef, list: { x: number; y: number; r: number }[]): void {
        for (const rc of list) {
            g.fillColor.set(120, 115, 100, 200);
            g.circle(rc.x, rc.y, rc.r);
            g.fill();
            g.fillColor.set(160, 155, 135, 160);
            g.circle(rc.x - rc.r * 0.25, rc.y + rc.r * 0.25, rc.r * 0.5);
            g.fill();
        }
    }

    /** 中心到各传送点的小路 */
    private drawRoads(g: Graphics, r: RegionDef, w = 40, color = '#C4B48E', inner = '#B3A27C'): void {
        for (const tp of r.teleports) {
            const dx = tp.pos.x, dy = tp.pos.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len < 60) continue;
            g.lineWidth = w;
            g.strokeColor.fromHEX(color);
            g.moveTo(0, 0);
            g.lineTo(tp.pos.x, tp.pos.y);
            g.stroke();
            g.lineWidth = w * 0.72;
            g.strokeColor.fromHEX(inner);
            g.moveTo(0, 0);
            g.lineTo(tp.pos.x, tp.pos.y);
            g.stroke();
        }
    }

    private drawBorder(g: Graphics, r: RegionDef): void {
        g.lineWidth = 6;
        g.strokeColor.fromHEX('#7A6F57');
        g.rect(-r.halfW, -r.halfH, r.halfW * 2, r.halfH * 2);
        g.stroke();
        g.fillColor.set(90, 82, 62, 60);
        g.circle(-r.halfW, -r.halfH, 160);
        g.fill();
        g.circle(r.halfW, -r.halfH, 160);
        g.fill();
        g.circle(-r.halfW, r.halfH, 160);
        g.fill();
        g.circle(r.halfW, r.halfH, 160);
        g.fill();
    }

    // ============ 样式：田园（村庄） ============

    private drawVillage(g: Graphics, r: RegionDef): void {
        // 泥土斑
        const patches = [
            { x: -250, y: -200, w: 500, h: 400, c: '#DDD3B6' },
            { x: 250, y: 150, w: 450, h: 350, c: '#DFD6BA' },
            { x: -350, y: 200, w: 400, h: 300, c: '#D8CEAF' },
        ];
        for (const p of patches) {
            g.fillColor.fromHEX(p.c);
            g.ellipse(p.x, p.y, p.w / 2, p.h / 2);
            g.fill();
        }
        // 小路（中心 → 传送点）
        this.drawRoads(g, r, 42);
        // 木桩/篱笆点缀
        g.fillColor.set(140, 120, 90, 160);
        const stumps = [{ x: -180, y: 260 }, { x: -150, y: 280 }, { x: 220, y: -280 }, { x: 250, y: -260 }];
        for (const s of stumps) {
            g.circle(s.x, s.y, 7);
            g.fill();
        }
        this.drawTrees(g, r, [
            { x: -420, y: 60, r: 40 }, { x: 420, y: 60, r: 42 }, { x: -380, y: -320, r: 34 },
            { x: 380, y: -300, r: 36 }, { x: 0, y: 330, r: 38 },
        ]);
        this.drawRocks(g, r, [
            { x: 120, y: -60, r: 14 }, { x: -120, y: 40, r: 12 }, { x: 320, y: 260, r: 10 },
        ]);
    }

    // ============ 样式：石板放射（中枢） ============

    private drawHub(g: Graphics, r: RegionDef): void {
        // 中央圆坛（石板）
        g.fillColor.fromHEX('#C9BC98');
        g.circle(0, 0, 150);
        g.fill();
        g.lineWidth = 3;
        g.strokeColor.fromHEX('#8F8367');
        g.circle(0, 0, 150);
        g.stroke();
        for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 * i) / 8;
            g.moveTo(Math.cos(a) * 24, Math.sin(a) * 24);
            g.lineTo(Math.cos(a) * 148, Math.sin(a) * 148);
            g.stroke();
        }
        // 放射石板路（到各传送点）
        this.drawRoads(g, r, 56);
        // 边缘淡墨弧线（远山示意）
        g.lineWidth = 2;
        g.strokeColor.set(110, 100, 80, 60);
        g.arc(0, r.halfH - 40, 300, Math.PI, 0, false);
        g.stroke();
        g.arc(0, -r.halfH + 40, 300, 0, Math.PI, false);
        g.stroke();
    }

    // ============ 样式：市集方砖（主城） ============

    private drawTown(g: Graphics, r: RegionDef): void {
        // 方砖网格
        g.lineWidth = 1;
        g.strokeColor.set(140, 130, 105, 60);
        for (let x = -r.halfW; x <= r.halfW; x += 80) {
            g.moveTo(x, -r.halfH);
            g.lineTo(x, r.halfH);
            g.stroke();
        }
        for (let y = -r.halfH; y <= r.halfH; y += 80) {
            g.moveTo(-r.halfW, y);
            g.lineTo(r.halfW, y);
            g.stroke();
        }
        // 十字街道（加宽）
        g.lineWidth = 70;
        g.strokeColor.fromHEX('#C9BC98');
        g.moveTo(0, -r.halfH);
        g.lineTo(0, r.halfH);
        g.stroke();
        g.moveTo(-r.halfW, 0);
        g.lineTo(r.halfW, 0);
        g.stroke();
        // 招募广场石台（中北）
        g.fillColor.fromHEX('#D3C6A4');
        g.circle(0, 120, 230);
        g.fill();
        g.lineWidth = 3;
        g.strokeColor.fromHEX('#8F8367');
        g.circle(0, 120, 230);
        g.stroke();
        // 市集建筑轮廓（墨线矩形，四角）
        const blds = [
            { x: -700, y: -420, w: 260, h: 160 }, { x: 700, y: -420, w: 260, h: 160 },
            { x: -700, y: 420, w: 260, h: 160 }, { x: 700, y: 420, w: 260, h: 160 },
            { x: -420, y: -420, w: 200, h: 120 }, { x: 420, y: -420, w: 200, h: 120 },
        ];
        g.lineWidth = 3;
        g.strokeColor.fromHEX('#7A6F57');
        for (const b of blds) {
            g.fillColor.set(140, 130, 110, 40);
            g.rect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
            g.fill();
            g.rect(b.x - b.w / 2, b.y - b.h / 2, b.w, b.h);
            g.stroke();
        }
    }

    // ============ 样式：青石庭院（门派） ============

    private drawSect(g: Graphics, r: RegionDef): void {
        // 青石方砖
        g.lineWidth = 1;
        g.strokeColor.set(120, 112, 92, 60);
        for (let x = -r.halfW; x <= r.halfW; x += 100) {
            g.moveTo(x, -r.halfH);
            g.lineTo(x, r.halfH);
            g.stroke();
        }
        for (let y = -r.halfH; y <= r.halfH; y += 100) {
            g.moveTo(-r.halfW, y);
            g.lineTo(r.halfW, y);
            g.stroke();
        }
        // 练武场（前院椭圆沙地）
        g.fillColor.fromHEX('#D8CBAB');
        g.ellipse(0, 40, 300, 170);
        g.fill();
        g.lineWidth = 3;
        g.strokeColor.fromHEX('#8F8367');
        g.ellipse(0, 40, 300, 170);
        g.stroke();
        // 大殿台基（北侧）
        g.fillColor.fromHEX('#C9BC98');
        g.rect(-240, 300, 480, 180);
        g.fill();
        g.lineWidth = 3;
        g.strokeColor.fromHEX('#7A6F57');
        g.rect(-240, 300, 480, 180);
        g.stroke();
        g.moveTo(-240, 390);
        g.lineTo(240, 390);
        g.stroke();
        // 两侧花木
        this.drawTrees(g, r, [
            { x: -420, y: 80, r: 36 }, { x: 420, y: 80, r: 36 },
            { x: -460, y: -240, r: 30 }, { x: 460, y: -240, r: 30 },
        ]);
        this.drawRocks(g, r, [
            { x: -200, y: -80, r: 13 }, { x: 200, y: -120, r: 11 }, { x: 0, y: 260, r: 12 },
        ]);
    }
}
