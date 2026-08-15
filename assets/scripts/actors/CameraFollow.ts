import { _decorator, Component, Node, view } from 'cc';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 镜头跟随（移动 World 容器实现，UI 相机不动）
 * 玩家移动时反向移动世界节点，使相机视野跟随玩家。
 * 限制在俯视大地图边界内。
 */
@ccclass('CameraFollow')
export class CameraFollow extends Component {
    /** 世界容器节点（含地面/玩家/NPC） */
    worldNode: Node | null = null;
    /** 跟随目标（玩家节点，World 内坐标） */
    target: Node | null = null;
    /** 地图半宽/半高（世界坐标） */
    mapHalfW: number = 1000;
    mapHalfH: number = 650;
    /** 平滑度 */
    lerpSpeed: number = 5;

    /** 当前世界节点偏移（用于视差） */
    get offsetX(): number {
        return this.worldNode ? this.worldNode.position.x : 0;
    }
    get offsetY(): number {
        return this.worldNode ? this.worldNode.position.y : 0;
    }

    update(dt: number): void {
        if (!this.worldNode || !this.target) return;
        const t = this.target.position;

        // 期望偏移 = 玩家位置的相反数（世界反向移动）
        const desiredX = -t.x;
        const desiredY = -t.y;

        // 视野半宽/半高
        const vw = view.getVisibleSize().width / 2;
        const vh = view.getVisibleSize().height / 2;

        // 边界 clamp：保证地面始终盖满屏幕
        const minX = -(this.mapHalfW - vw);
        const maxX = this.mapHalfW - vw;
        const minY = -(this.mapHalfH - vh);
        const maxY = this.mapHalfH - vh;
        let cx = desiredX;
        let cy = desiredY;
        if (minX < maxX) cx = Math.max(minX, Math.min(maxX, desiredX)); else cx = 0;
        if (minY < maxY) cy = Math.max(minY, Math.min(maxY, desiredY)); else cy = 0;

        // 平滑插值
        const k = 1 - Math.exp(-this.lerpSpeed * dt);
        const nx = this.worldNode.position.x + (cx - this.worldNode.position.x) * k;
        const ny = this.worldNode.position.y + (cy - this.worldNode.position.y) * k;
        this.worldNode.setPosition(nx, ny, 0);
    }

    /** 立即跳转到玩家位置（无平滑） */
    snap(): void {
        if (!this.worldNode || !this.target) return;
        this.worldNode.setPosition(-this.target.position.x, -this.target.position.y, 0);
    }
}
