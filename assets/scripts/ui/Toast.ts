import { _decorator, Component, Node, Label, Color, UITransform, tween, UIOpacity, Vec3, Graphics } from 'cc';
import { EventBus, Events } from '../core/EventBus.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - Toast 提示
 * 深色背景板 + 亮色文字，保证与任何背景对比清晰。
 * 监听 Events.TOAST 事件自动弹出。
 */
@ccclass('Toast')
export class Toast extends Component {
    private label: Label | null = null;
    private root: Node | null = null;

    onLoad(): void {
        const root = new Node('Toast');
        this.node.addChild(root);
        this.root = root;
        // 背景板（半透明深色圆角，文字在其上清晰可见）
        const g = root.addComponent(Graphics);
        g.fillColor.set(30, 24, 18, 225);
        g.roundRect(-300, -32, 600, 64, 14);
        g.fill();
        g.lineWidth = 2;
        g.strokeColor.fromHEX('#C9B896');
        g.roundRect(-300, -32, 600, 64, 14);
        g.stroke();
        root.addComponent(UITransform).setContentSize(600, 64);
        // 文字（子节点，亮金色加粗）
        const labelNode = new Node('label');
        root.addChild(labelNode);
        labelNode.setPosition(0, 0, 0);
        const l = labelNode.addComponent(Label);
        l.fontSize = 22; l.lineHeight = 30;
        l.color = new Color(255, 236, 190, 255);
        l.isBold = true;
        l.horizontalAlign = Label.HorizontalAlign.CENTER;
        l.verticalAlign = Label.VerticalAlign.CENTER;
        labelNode.addComponent(UITransform).setContentSize(580, 60);
        this.label = l;
        root.setPosition(0, -240, 0);
        root.active = false;

        // 监听 Toast 事件
        EventBus.on(Events.TOAST, this.show, this);
    }

    onDestroy(): void {
        EventBus.off(Events.TOAST, this.show, this);
    }

    show(msg: string): void {
        if (!this.root || !this.label) return;
        this.label.string = msg;
        this.root.active = true;
        const op = this.root.getComponent(UIOpacity) || this.root.addComponent(UIOpacity);
        op.opacity = 255;
        this.root.setScale(0.8, 0.8, 1);
        tween(this.root)
            .to(0.15, { scale: new Vec3(1, 1, 1) }, { easing: 'backOut' })
            .delay(1.6)
            .call(() => { this.root!.active = false; })
            .start();
    }
}
