import { ECS, ecs, EcsBase, ecsclass, IFilter } from "./ecs";
import EcsEntity from "./EcsEntity";

interface ITimerCallback {
    (...args: any[]): false | void
}

class Timer {
    // 回调
    callback: ITimerCallback = null;
    target: any = null;
    // 间隔帧数
    interval = 1;
    // 执行次数 <=0 为无限次
    times = 0;

    // 已执行帧数
    count = 0;

    constructor(callback: ITimerCallback, interval = 1, times = 0, target: any = null) {
        this.callback = callback;
        this.interval = interval;
        this.times = times;
        this.target = target;
    }
}

/**
 * 定时器管理器
 * @example
 * timer.on(this,()=>cc.log(1),3,2) // 3个update后执行cc.log(1)，执行2次
 */
class TimerManager {
    /**基于次数 */
    private timers: Timer[] = [];

    /**
     * 监听
     * @param interval 间隔
     * @param times 次数 <=0 为无限次
     */
    on(callback: ITimerCallback, interval = 1, times = 0, target?: any) {
        this.timers.push(new Timer(callback, interval, times, target));
    }

    /**
     * 监听一次
     */
    once(callback: ITimerCallback, target?: any) {
        this.timers.push(new Timer(callback, 1, 1, target));
    }

    /**
     * 取消监听
     */
    off(callback: ITimerCallback, target?: any) {
        for (let index = this.timers.length - 1; index >= 0; index--) {
            const timer = this.timers[index];
            if (timer[1] === callback && (target ? timer[0] === target : true)) {
                this.timers.splice(index, 1);
            }
        }
    }

    /**
     * 调用一次
     */
    update(args: any[]) {
        for (let index = 0; index < this.timers.length; index++) {
            const timer = this.timers[index];
            if (++timer.count >= timer.interval) {
                const result = timer.callback.apply(timer.target, args);
                if (result === false || (timer.times > 0 && --timer.times <= 0)) {
                    this.timers.splice(index--, 1);
                } else {
                    timer.count = 0;
                }
            }
        }
    }

    clear() {
        this.timers.length = 0;
    }
}

@ecsclass('EcsSystem')
export class EcsSystem extends EcsBase {
    /**类名 */
    public get ecsClassName() {
        return (this.constructor as typeof EcsBase).ecsClassName;
    }

    /**
     * 指定ecs名字
     */
    private ecsName: string = 'default';
    private _ecs: ECS = null;
    protected get ecs() {
        if (!this._ecs) this._ecs = ecs.getECS(this.ecsName);
        return this._ecs;
    }

    protected readonly excuteTimer = new TimerManager();
    protected readonly updateTimer = new TimerManager();

    /**
     * 可以根据name绑定一个ecs，默认是default
     */
    constructor(ecsName?: string) {
        super();
        this.ecsName = typeof ecsName !== 'string' ? 'default' : (ecsName || 'default');
    }

    /**系统生效 */
    protected onEnable() { }

    /**系统失效 */
    protected onDisable() { }

    /**过滤实体的条件 */
    protected filter: IFilter = null;
    /**开启并配置filter后，才能响应onEntityEnter、onEntityLeave */
    protected openWatchEntities = false;
    /**开启openWatchEntities功能后用来记录数据 */
    private watchEntities: EcsEntity[] = null;

    /**使用filter进行查询 */
    protected query<T extends EcsEntity>(): T[] {
        if (this.watchEntities) return this.watchEntities as T[];
        return this.ecs.query<T>(this.filter);
    }

    /**实体进入系统，会在excute流程最开始调用*/
    protected onEntityEnter(entities: EcsEntity[]) { };

    /**实体进入系统，会在excute流程最开始调用*/
    protected onEntityLeave(entities: EcsEntity[]) { };

    // 由ecs.excute驱动
    private ecsExcuteTimer(args: any[]) {
        if (this.filter && this.openWatchEntities) {
            const oldEntities = this.watchEntities;
            this.watchEntities = this.ecs.query(this.filter);
            const enter = this.watchEntities.filter(entity => {
                return oldEntities.indexOf(entity) === 1;
            });
            const leave = oldEntities.filter(entity => {
                return this.watchEntities.indexOf(entity) === 1;
            });
            this.onEntityEnter(enter);
            this.onEntityLeave(leave);
        }

        this.excuteTimer.update(args);
    }
    protected ecsExcute(...args: any[]) { }
    protected ecsBeforeExcute(...args: any[]) { }
    protected ecsAfterExcute(...args: any[]) { }

    // 由ecs.update驱动
    private ecsUpdateTimer(args: any[]) { this.updateTimer.update(args); }
    protected ecsUpdate(...args: any[]) { }
    protected ecsBeforeUpdate(...args: any[]) { }
    protected ecsAfterUpdate(...args: any[]) { }

    protected log(str: any, ...args: any[]) {
        console.log(`[${this.ecsClassName}] [log] ${str}`, ...args);
    }
    protected warn(str: any, ...args: any[]) {
        console.warn(`[${this.ecsClassName}] [warn] ${str}`, ...args);
    }
    protected error(str: any, ...args: any[]) {
        console.error(`[${this.ecsClassName}] [error] ${str}`, ...args);
    }
}