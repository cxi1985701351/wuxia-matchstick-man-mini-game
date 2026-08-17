/**
 * 墨江湖 - 简单事件总线（解耦系统间通信）
 */
type Handler = (...args: any[]) => void;

interface HandlerEntry {
    fn: Handler;
    ctx: unknown;
}

export class EventBus {
    private static handlers: Record<string, HandlerEntry[]> = {};

    static on(event: string, fn: Handler, ctx?: unknown): void {
        if (!this.handlers[event]) this.handlers[event] = [];
        this.handlers[event].push({ fn, ctx });
    }

    static off(event: string, fn: Handler, ctx?: unknown): void {
        const list = this.handlers[event];
        if (!list) return;
        const i = list.findIndex((e) => e.fn === fn && e.ctx === ctx);
        if (i >= 0) list.splice(i, 1);
    }

    static emit(event: string, ...args: any[]): void {
        const list = this.handlers[event];
        if (!list) return;
        for (const entry of [...list]) {
            try {
                entry.fn.apply(entry.ctx, args);
            } catch (e) {
                console.error(`[EventBus] handler error on ${event}:`, e);
            }
        }
    }

    static clear(): void {
        this.handlers = {};
    }
}

// 暴露到 window 便于调试
declare const window: any;
if (typeof window !== 'undefined') {
    window.__MoJiangEventBus = EventBus;
}

/** 事件名常量 */
export const Events = {
    PLAYER_STATE_CHANGED: 'player-state-changed',
    BATTLE_START: 'battle-start',
    BATTLE_END: 'battle-end',
    BATTLE_DAMAGE: 'battle-damage',
    BATTLE_DEATH: 'battle-death',
    BATTLE_SKILL_USED: 'battle-skill-used',
    /** 回合制事件 */
    TURN_START: 'turn-start',
    TURN_END: 'turn-end',
    PLAYER_TURN: 'player-turn',
    ENEMY_TURN: 'enemy-turn',
    ACTOR_TURN_DONE: 'actor-turn-done',
    NPC_DIALOG_OPEN: 'npc-dialog-open',
    NPC_DIALOG_CLOSE: 'npc-dialog-close',
    MARTIAL_PANEL_OPEN: 'martial-panel-open',
    MARTIAL_PANEL_CLOSE: 'martial-panel-close',
    WEAPON_CHANGED: 'weapon-changed',
    LEVEL_UP: 'level-up',
    TOWER_OPEN: 'tower-open',
    TOWER_CLOSE: 'tower-close',
    TOWER_CHALLENGE: 'tower-challenge',
    FLOAT_TEXT: 'float-text',
    TOAST: 'toast',
    /** 主菜单选档完成（GameRoot 收到后构建世界） */
    MENU_START: 'menu-start',
};
