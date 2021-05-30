import * as cc from "cc"
import ecs from "./ecs";

export default class EcsSystem {
    private _sort: number = Number.NaN;
    public get sort() {
        return this._sort;
    }

    private _systemName: string = cc.js.getClassName(this);
    public get systemName() {
        return this._systemName;
    }

    /**
     * 指定ecs名字
     */
    private ecsName: string = 'default';
    protected get ecs() {
        return ecs.getECS(this.ecsName);
    }

    constructor(sort: number, ecsName?: string);
    constructor(...args: any[]) {
        const ecsName = args[1];
        this.ecsName = typeof ecsName !== 'string' ? 'default' : (ecsName || 'default');

        const sort = args[0];
        this._sort = Number.isNaN(Number(sort)) ? Number.NaN : Number(sort);

        if (this._systemName !== 'System' && this._systemName.slice(-6) === 'System') {
            this.ecs.addSystem(this);
        } else if (CC_EDITOR) {
            Editor.error(`[${this._systemName}] [error] system命名错误(应为 xxxxSystem 以System结尾)`);
        } else if (CC_DEBUG) {
            this.error('system命名错误(应为 xxxxSystem 以System结尾)');
        }
        if (Number.isNaN(this._sort)) {
            if (CC_EDITOR) {
                Editor.warn(`[${this._systemName}] [warn] 请定义sort值, 它影响system的执行顺序`);
            } else if (CC_DEBUG) {
                this.error('请定义sort值, 它影响system的执行顺序');
            }
        }
    }

    protected log(str: string, ...args: any[]) {
        console.log(`[${this._systemName}] [log] ${str}`, ...args);
    }
    protected warn(str: string, ...args: any[]) {
        console.warn(`[${this._systemName}] [warn] ${str}`, ...args);
    }
    protected error(str: string, ...args: any[]) {
        console.error(`[${this._systemName}] [error] ${str}`, ...args);
    }

    protected ecsUpdateTimerOn(callback: Function, frameCount = 1, times = 1) {
        this.ecs.updateTimer.on(this, callback, frameCount, times);
    }

    protected ecsExcuteTimerOn(callback: Function, frameCount = 1, times = 1) {
        this.ecs.excuteTimer.on(this, callback, frameCount, times);
    }

    protected ecsUpdateTimerOff(callback: Function) {
        this.ecs.updateTimer.off(callback, this);
    }

    protected ecsExcuteTimerOff(callback: Function) {
        this.ecs.excuteTimer.off(callback, this);
    }

    // 由ecs.excute驱动
    public ecsExcute(data1?: any, data2?: any, data3?: any, data4?: any, data5?: any) { }

    // 由ecs.update驱动
    public ecsUpdate(data1?: any, data2?: any, data3?: any, data4?: any, data5?: any) { }
}
