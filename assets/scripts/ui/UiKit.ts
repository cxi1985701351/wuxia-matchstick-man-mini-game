import { Node, Label, Graphics, Color, UITransform, Button } from 'cc';

/**
 * 墨江湖 - UI 构建工具
 * 统一创建"背景节点 + 文字子节点"分离结构的按钮/面板，
 * 避免同节点多渲染组件（Graphics + Label）的渲染顺序问题
 * （文字被背景盖住 = 对话框选项"空白"的根因）。
 */

export interface InkButtonOptions {
    x?: number;
    y?: number;
    w?: number;
    h?: number;
    fontSize?: number;
    textColor?: string;
    bgColor?: string;
    borderColor?: string;
    bold?: boolean;
    /** 按钮回调 */
    onClick?: () => void;
}

/** 创建墨风按钮：返回父节点（背景），文字在子节点 */
export function makeInkButton(parent: Node, text: string, opts: InkButtonOptions = {}): Node {
    const w = opts.w ?? 180;
    const h = opts.h ?? 44;
    const btn = new Node('btn');
    parent.addChild(btn);
    if (opts.x !== undefined) btn.setPosition(opts.x, opts.y ?? 0, 0);

    // 背景（父节点 Graphics）
    const g = btn.addComponent(Graphics);
    const border = opts.borderColor ?? '#C9B896';
    const bg = opts.bgColor ?? '#5A4A35';
    g.lineWidth = 2;
    g.strokeColor.fromHEX(border);
    g.roundRect(-w / 2, -h / 2, w, h, 10);
    g.stroke();
    g.fillColor.fromHEX(bg);
    g.roundRect(-w / 2, -h / 2, w, h, 10);
    g.fill();

    // 文字（子节点，永远在背景上层；SHRINK 固定文本框尺寸）
    const labelNode = new Node('label');
    btn.addChild(labelNode);
    labelNode.setPosition(0, 0, 0);
    const l = labelNode.addComponent(Label);
    l.string = text;
    l.fontSize = opts.fontSize ?? 20;
    l.lineHeight = l.fontSize + 6;
    l.color = new Color().fromHEX(opts.textColor ?? '#F0E6CE');
    l.isBold = opts.bold ?? false;
    l.horizontalAlign = Label.HorizontalAlign.CENTER;
    l.verticalAlign = Label.VerticalAlign.CENTER;
    l.overflow = Label.Overflow.SHRINK;
    const fixBtnSize = (): void => {
        if (!labelNode.isValid) return;
        const ut = labelNode.getComponent(UITransform);
        if (ut) ut.setContentSize(w, h);
    };
    fixBtnSize();
    setTimeout(fixBtnSize, 0);

    // 交互
    const fixBtnTransform = (): void => {
        if (!btn.isValid) return;
        const ut = btn.getComponent(UITransform);
        if (ut) ut.setContentSize(w, h);
    };
    fixBtnTransform();
    setTimeout(fixBtnTransform, 0);
    if (opts.onClick) {
        const b = btn.addComponent(Button);
        b.transition = Button.Transition.SCALE;
        b.zoomScale = 0.95;
        btn.on(Button.EventType.CLICK, opts.onClick);
    }
    return btn;
}

/** 创建文字标签（子节点结构，带可选描边；默认 SHRINK 固定文本框尺寸，保证布局间距可控） */
export function makeInkLabel(
    parent: Node,
    text: string,
    opts: { x?: number; y?: number; fontSize?: number; color?: string; bold?: boolean; w?: number; h?: number; overflow?: Label.Overflow } = {},
): Label {
    const node = new Node('label');
    parent.addChild(node);
    node.setPosition(opts.x ?? 0, opts.y ?? 0, 0);
    const l = node.addComponent(Label);
    l.string = text;
    l.fontSize = opts.fontSize ?? 20;
    l.lineHeight = l.fontSize + 6;
    l.color = new Color().fromHEX(opts.color ?? '#F0E6CE');
    l.isBold = opts.bold ?? false;
    l.horizontalAlign = Label.HorizontalAlign.CENTER;
    l.verticalAlign = Label.VerticalAlign.CENTER;
    // 固定文本框：SHRINK 防止文本撑大/溢出 UITransform（overflow NONE 时引擎接管 contentSize）
    l.overflow = opts.overflow ?? Label.Overflow.SHRINK;
    const w = opts.w ?? 300;
    const h = opts.h ?? 40;
    const fixSize = (): void => {
        if (!node.isValid) return;
        const ut = node.getComponent(UITransform);
        if (ut) ut.setContentSize(w, h);
    };
    fixSize();
    // Label 初始化（onLoad/string/overflow 变更）可能异步覆盖 contentSize，延迟一个宏任务重新固定
    setTimeout(fixSize, 0);
    return l;
}

/** 创建面板背景（圆角深色面板） */
export function makeInkPanel(parent: Node, w: number, h: number, opts: { bg?: string; border?: string; radius?: number } = {}): Node {
    const panel = new Node('panel');
    parent.addChild(panel);
    const g = panel.addComponent(Graphics);
    const bg = opts.bg ?? '#322D26';
    const border = opts.border ?? '#C9B896';
    const r = opts.radius ?? 16;
    g.fillColor.fromHEX(bg);
    g.roundRect(-w / 2, -h / 2, w, h, r);
    g.fill();
    g.lineWidth = 3;
    g.strokeColor.fromHEX(border);
    g.roundRect(-w / 2, -h / 2, w, h, r);
    g.stroke();
    return panel;
}
