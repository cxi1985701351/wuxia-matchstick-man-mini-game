import { _decorator, Component, Node, Graphics, input, Input, EventTouch, EventMouse, sys, Vec2 } from 'cc';
import { WorldManager } from '../core/WorldManager.ts';
import { EventBus, Events } from '../core/EventBus.ts';
import { makeInkButton } from './UiKit.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 触屏控制层（微信小游戏/手机端 + PC 鼠标兼容）
 * 虚拟摇杆（左下）+ 交互/快捷栏/退出按钮（右侧），替代键盘操作：
 *   摇杆 → WASD 移动（写入 PlayerController.setTouchMove）
 *   交互 → E 键（tryInteract）
 *   背包/图鉴/任务/宗门 → B/C/Q/V（面板开关）
 *   退出 → ESC（保存并返回存档页）
 * 输入：touch 事件（真机）+ mouse 拖拽（PC/headless 测试，引擎在无触屏设备只注册 mouse 监听）。
 * 仅触屏设备创建（sys.hasTouch）；URL 带 ?touch=1 时强制开启（桌面调试）。
 * PC 键盘输入完全保留，二者并存。
 */
@ccclass('TouchControls')
export class TouchControls extends Component {
    private wm: WorldManager | null = null;
    private root: Node | null = null;

    // 摇杆
    private joyBase: Node | null = null;
    private joyKnob: Node | null = null;
    private joyCenter: Vec2 = { x: 0, y: 0 };
    private joyRadius = 70;
    private joyActive = false;
    private joyTouchId = -1;
    /** 鼠标拖拽激活（无触屏设备上用鼠标模拟摇杆） */
    private mouseActive = false;

    /**
     * 触屏层是否启用：**默认总是显示**（浏览器测试画面与小程序一致）。
     * URL 带 ?touch=0 可强制隐藏（PC 纯净模式/自动化测试用）。
     */
    static isTouchEnabled(): boolean {
        if (typeof location !== 'undefined' && location.search.includes('touch=0')) return false;
        return true;
    }

    init(wm: WorldManager): void {
        this.wm = wm;
        this.build();
        input.on(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.on(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.on(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        // 鼠标拖拽摇杆（PC 附加能力；引擎在无触屏设备仅注册 mouse 监听）
        input.on(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        // 战斗时隐藏触屏层（战斗界面自带指令按钮）
        EventBus.on(Events.BATTLE_START, this.hide, this);
        EventBus.on(Events.BATTLE_END, this.show, this);
    }

    onDestroy(): void {
        input.off(Input.EventType.TOUCH_START, this.onTouchStart, this);
        input.off(Input.EventType.TOUCH_MOVE, this.onTouchMove, this);
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        input.off(Input.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
        input.off(Input.EventType.MOUSE_DOWN, this.onMouseDown, this);
        input.off(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
        input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this);
        EventBus.off(Events.BATTLE_START, this.hide, this);
        EventBus.off(Events.BATTLE_END, this.show, this);
    }

    private build(): void {
        const root = new Node('TouchControls');
        this.node.addChild(root);
        this.root = root;

        // ===== 左下：虚拟摇杆（底圈 + 摇杆头）=====
        const joyBase = new Node('joystick');
        root.addChild(joyBase);
        joyBase.setPosition(-400, -240, 0);
        this.joyBase = joyBase;
        // getUILocation() 返回 UI 坐标（原点在设计分辨率左下角 1280×720）；
        // 画布中心 = (640,360)，摇杆局部 (-400,-240) → UI (240,120)
        this.joyCenter = { x: 640 - 400, y: 360 - 240 };
        const bg = joyBase.addComponent(Graphics);
        bg.fillColor.fromHEX('#3A3328');
        bg.circle(0, 0, this.joyRadius);
        bg.fill();
        bg.fillColor.set(70, 60, 46, 220);
        bg.circle(0, 0, this.joyRadius - 12);
        bg.fill();
        const knob = new Node('knob');
        joyBase.addChild(knob);
        const kg = knob.addComponent(Graphics);
        kg.fillColor.fromHEX('#C9B896');
        kg.circle(0, 0, 26);
        kg.fill();
        this.joyKnob = knob;

        // ===== 右侧：交互 + 快捷栏 + 退出（纵列，x=470 避开 HUD 存档按钮区；间隙 24）=====
        const btnX = 470;
        const yPos = [145, 69, -7, -83, -159, -235];
        const defs = [
            { label: '交 互', y: yPos[0], w: 120, h: 56, fn: () => this.wm?.tryInteract() },
            { label: '背 包', y: yPos[1], w: 100, h: 52, fn: () => this.wm?.toggleBag() },
            { label: '图 鉴', y: yPos[2], w: 100, h: 52, fn: () => this.wm?.toggleCodex() },
            { label: '任 务', y: yPos[3], w: 100, h: 52, fn: () => this.wm?.toggleQuest() },
            { label: '宗 门', y: yPos[4], w: 100, h: 52, fn: () => this.wm?.toggleSect() },
            { label: '退 出', y: yPos[5], w: 100, h: 52, fn: () => this.wm?.exitToMenu() },
        ];
        for (const d of defs) {
            makeInkButton(root, d.label, {
                x: btnX, y: d.y, w: d.w, h: d.h, fontSize: 18,
                bgColor: '#4A3B2A', borderColor: '#C9B896', textColor: '#F5EAD0',
                onClick: d.fn,
            });
        }

        this.show();
    }

    // ===== 摇杆核心（touch / mouse 共用）=====

    /** 判定点是否在摇杆底圈范围内 */
    private inJoyZone(uiX: number, uiY: number): boolean {
        const dx = uiX - this.joyCenter.x;
        const dy = uiY - this.joyCenter.y;
        return Math.sqrt(dx * dx + dy * dy) <= this.joyRadius + 30;
    }

    private joyDrag(uiX: number, uiY: number): void {
        let dx = uiX - this.joyCenter.x;
        let dy = uiY - this.joyCenter.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > this.joyRadius) {
            dx = (dx / len) * this.joyRadius;
            dy = (dy / len) * this.joyRadius;
        }
        // 归一化方向（-1~1）写入玩家
        const nx = dx / this.joyRadius;
        const ny = dy / this.joyRadius;
        this.wm?.playerController?.setTouchMove(nx, ny);
        // 摇杆头跟随
        if (this.joyKnob) this.joyKnob.setPosition(dx, dy, 0);
    }

    private joyReset(): void {
        this.wm?.playerController?.setTouchMove(0, 0);
        if (this.joyKnob) this.joyKnob.setPosition(0, 0, 0);
    }

    // ===== touch 输入 =====

    private onTouchStart(e: EventTouch): void {
        if (!this.root?.active) return;
        const ui = e.getUILocation();
        if (this.inJoyZone(ui.x, ui.y)) {
            this.joyActive = true;
            this.joyTouchId = e.getID();
        }
    }

    private onTouchMove(e: EventTouch): void {
        if (!this.joyActive || e.getID() !== this.joyTouchId) return;
        const ui = e.getUILocation();
        this.joyDrag(ui.x, ui.y);
    }

    private onTouchEnd(e: EventTouch): void {
        if (e.getID() !== this.joyTouchId) return;
        this.joyActive = false;
        this.joyTouchId = -1;
        this.joyReset();
    }

    // ===== mouse 输入（摇杆拖拽；PC 附加能力）=====

    private onMouseDown(e: EventMouse): void {
        if (!this.root?.active) return;
        if (e.getButton() !== EventMouse.BUTTON_LEFT) return;
        const ui = e.getUILocation();
        if (this.inJoyZone(ui.x, ui.y)) {
            this.mouseActive = true;
            this.joyActive = true;
            this.joyDrag(ui.x, ui.y);
        }
    }

    private onMouseMove(e: EventMouse): void {
        if (!this.mouseActive) return;
        const ui = e.getUILocation();
        this.joyDrag(ui.x, ui.y);
    }

    private onMouseUp(e: EventMouse): void {
        if (!this.mouseActive) return;
        if (e.getButton() !== EventMouse.BUTTON_LEFT) return;
        this.mouseActive = false;
        this.joyActive = false;
        this.joyReset();
    }

    hide(): void {
        if (this.root) this.root.active = false;
    }

    show(): void {
        if (this.root) this.root.active = true;
    }
}
