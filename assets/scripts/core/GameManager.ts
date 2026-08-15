import { _decorator, Component } from 'cc';
import { PlayerState } from '../data/GameTypes.ts';
import { MARTIAL_ARTS } from '../data/MartialArts.ts';
import { getWeaponById } from '../data/Weapons.ts';
import { StatCalculator } from '../combat/StatCalculator.ts';
import { FighterStats } from '../data/GameTypes.ts';
import { SaveSystem } from './SaveSystem.ts';
import { EventBus, Events } from './EventBus.ts';

const { ccclass } = _decorator;

/**
 * 墨江湖 - 全局游戏管理器（单例）
 * 持有玩家状态，提供存档/升级/装备等接口。
 */
@ccclass('GameManager')
export class GameManager extends Component {
    private static _inst: GameManager | null = null;
    static get inst(): GameManager {
        if (!this._inst) throw new Error('GameManager not initialized!');
        return this._inst;
    }

    state: PlayerState = SaveSystem.load();

    /** 当前实时战斗面板（战斗中使用） */
    stats: FighterStats | null = null;

    protected onLoad(): void {
        GameManager._inst = this;
        this.recomputeStats();
    }

    onDestroy(): void {
        if (GameManager._inst === this) GameManager._inst = null;
    }

    /** 重算面板并广播 */
    recomputeStats(): void {
        const s = this.state;
        this.stats = StatCalculator.compute(s.level, s.weaponId, s.equipped.neigong, s.equipped.qinggong, s.equipped.wugong);
        EventBus.emit(Events.PLAYER_STATE_CHANGED, this.state, this.stats);
    }

    /** 增加修为，处理升级 */
    gainXp(amount: number): void {
        this.state.xp += amount;
        let leveled = false;
        while (this.state.level < 30) {
            const need = this.state.level * 20;
            if (this.state.xp < need) break;
            this.state.xp -= need;
            this.state.level += 1;
            leveled = true;
        }
        if (leveled) EventBus.emit(Events.LEVEL_UP, this.state.level);
        this.recomputeStats();
        this.save();
    }

    /** 装备武学到指定槽位 */
    equipMartial(martialId: string, slot: 'neigong' | 'qinggong' | 'wugong', index?: number): boolean {
        const ma = MARTIAL_ARTS[martialId];
        if (!ma || !this.state.ownedMartials.includes(martialId)) return false;
        const s = this.state;
        if (slot === 'neigong' && ma.type === 'neigong') {
            s.equipped.neigong = martialId;
        } else if (slot === 'qinggong' && ma.type === 'qinggong') {
            s.equipped.qinggong = martialId;
        } else if (slot === 'wugong' && ma.type === 'wugong') {
            const i = index ?? s.equipped.wugong.findIndex((x) => x === undefined);
            if (i < 0) return false;
            s.equipped.wugong[i] = martialId;
        } else {
            return false;
        }
        this.recomputeStats();
        this.save();
        return true;
    }

    /** 卸下武学 */
    unequipMartial(slot: 'neigong' | 'qinggong' | 'wugong', index?: number): void {
        const s = this.state;
        if (slot === 'neigong') s.equipped.neigong = undefined;
        else if (slot === 'qinggong') s.equipped.qinggong = undefined;
        else if (slot === 'wugong' && index !== undefined) s.equipped.wugong[index] = undefined;
        this.recomputeStats();
        this.save();
    }

    /** 切换武器（校验是否拥有） */
    equipWeapon(weaponId: string): boolean {
        if (!this.state.ownedWeapons.includes(weaponId)) return false;
        const s = this.state;
        s.weaponId = weaponId;
        // 换武器后，过滤掉不匹配的武功槽
        const w = getWeaponById(weaponId);
        s.equipped.wugong = s.equipped.wugong.map((mid) => {
            if (!mid) return undefined;
            const ma = MARTIAL_ARTS[mid];
            return ma && ma.weapon === w.type ? mid : undefined;
        });
        this.recomputeStats();
        this.save();
        EventBus.emit(Events.WEAPON_CHANGED, weaponId);
        return true;
    }

    /** 获得武器 */
    gainWeapon(weaponId: string): boolean {
        if (this.state.ownedWeapons.includes(weaponId)) return false;
        this.state.ownedWeapons.push(weaponId);
        this.save();
        EventBus.emit(Events.TOAST, `获得武器：${getWeaponById(weaponId).name}`);
        return true;
    }

    /** 获得武学（直接习得） */
    gainMartial(martialId: string): boolean {
        if (this.state.ownedMartials.includes(martialId)) return false;
        this.state.ownedMartials.push(martialId);
        this.save();
        EventBus.emit(Events.TOAST, `习得武学：${MARTIAL_ARTS[martialId].name}`);
        return true;
    }

    /** 获得武学残页（集齐 3 张自动习得） */
    gainFragment(martialId: string): boolean {
        const ma = MARTIAL_ARTS[martialId];
        if (!ma) return false;
        if (this.state.ownedMartials.includes(martialId)) return false;
        const cur = (this.state.fragments[martialId] ?? 0) + 1;
        this.state.fragments[martialId] = cur;
        if (cur >= 3) {
            this.state.fragments[martialId] = 0;
            this.gainMartial(martialId);
        } else {
            EventBus.emit(Events.TOAST, `获得「${ma.name}」残页 (${cur}/3)`);
        }
        this.save();
        return true;
    }

    /** 切磋胜利结算 */
    onBattleWin(xp: number, dropMartial?: string, dropWeapon?: string): void {
        this.state.kills += 1;
        this.gainXp(xp);
        if (dropMartial) this.gainFragment(dropMartial);
        // gainWeapon 内部会发 Toast「获得武器：中文名」
        if (dropWeapon) this.gainWeapon(dropWeapon);
        this.save();
    }

    /** 战斗后恢复状态（模拟回城） */
    restoreAfterBattle(): void {
        if (this.stats) {
            this.stats.hp = this.stats.maxHp;
            this.stats.mp = this.stats.maxMp;
        }
    }

    /** 境界称号 */
    get realmName(): string {
        const lv = this.state.level;
        if (lv <= 5) return '炼气期';
        if (lv <= 10) return '筑基期';
        if (lv <= 15) return '金丹期';
        if (lv <= 20) return '元婴期';
        if (lv <= 25) return '化神期';
        return '大乘期';
    }

    save(): void {
        SaveSystem.save(this.state);
    }
}
