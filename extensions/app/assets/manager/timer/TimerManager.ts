import { _decorator } from 'cc';
import BaseManager from '../../base/BaseManager';
const { ccclass } = _decorator;

type ICallback = (...args: any[]) => any;

class DailyTimer {
    // 获取当前时间相对于当日零点的毫秒数
    private static getDayTimeMs(date: Date): number {
        return (
            date.getHours() * 3600 +
            date.getMinutes() * 60 +
            date.getSeconds()
        ) * 1000 + date.getMilliseconds();
    }

    // 静态方法解析时间为毫秒数
    private static parseTimeToMs(h: number, m: number, s: number): number {
        return ((h * 3600 + m * 60 + s) * 1000) % 86400000;
    }

    private readonly startMs: number;  // 起始时间毫秒数（相对于当日零点）
    private readonly endMs: number;    // 结束时间毫秒数

    // 用于检查当前时间是否可触发回调
    private checkDay = 0;

    constructor(
        time: string,
        public readonly callback: ICallback,
        public readonly target?: unknown,
        public readonly once: boolean = false
    ) {
        // 使用解构赋值提高可读性
        const [startSegment, endSegment = startSegment] = time.split('-');

        // 开始时间
        const [startH = 0, startM = 0, startS = 0] = startSegment.split(':').map(
            part => Math.max(0, parseInt(part, 10) || 0)
        );
        this.startMs = DailyTimer.parseTimeToMs(startH, startM, startS);

        // 结束时间
        const [endH = 0, endM = 0, endS = 0] = endSegment.split(':').map(
            part => Math.max(0, parseInt(part, 10) || 0)
        );
        this.endMs = DailyTimer.parseTimeToMs(endH, endM, endS);
        // 结束时间与开始时间不能相同
        if (this.endMs === this.startMs) {
            if (startM === 0 && startS === 0) {
                this.endMs = DailyTimer.parseTimeToMs(startH + 1, startM, startS);
            } else if (startS === 0) {
                this.endMs = DailyTimer.parseTimeToMs(startH, startM + 1, startS);
            } else {
                this.endMs = DailyTimer.parseTimeToMs(startH, startM, startS + 1);
            }
        }
    }

    // 获取当前时间是否在时间范围内
    private isInRange(now: Date): boolean {
        const currentMs = DailyTimer.getDayTimeMs(now);

        // 处理跨天时间段（如 23:00-01:00）
        return this.startMs <= this.endMs
            ? currentMs >= this.startMs && currentMs < this.endMs
            : currentMs >= this.startMs || currentMs < this.endMs;
    }

    update(now: Date): boolean {
        const dateDay = now.getDay();

        if (this.checkDay === dateDay) return false;
        if (!this.isInRange(now)) return false;

        this.checkDay = dateDay;
        this.callback.call(this.target);

        return this.once;
    }
}

class IntervalTimer {
    private elapsed: number = 0;

    constructor(
        public readonly interval: number,
        public readonly callback: ICallback,
        public readonly target?: unknown,
        public readonly once: boolean = false
    ) { }

    update(dt: number): boolean {
        this.elapsed += dt;
        let completed = false;

        // 处理可能多次触发的情况（当dt > interval时）
        while (this.elapsed >= this.interval) {
            this.callback.call(this.target);
            this.elapsed -= this.interval;

            if (this.once) {
                completed = true;
                break;
            }
        }

        return completed;
    }
}

class Timer {
    static update(timer: Timer, dt: number) {
        return timer.update(dt);
    }

    private intervalTimer: IntervalTimer[] = [];

    /**
     * 注册定时器
     * @param interval 
     * @param callback 
     * @param target 
     * @param once 
     */
    register(
        interval: number,
        callback: ICallback,
        target?: unknown,
        once?: boolean
    ): void {
        const timer = new IntervalTimer(interval, callback, target, once || false);
        this.intervalTimer.push(timer);
    }

    /**
     * 取消定时器
     * @param callback 
     * @param target 
     */
    unregister(callback: ICallback, target?: unknown): void {
        if (typeof target === 'undefined') {
            this.intervalTimer = this.intervalTimer.filter(
                timer => timer.callback !== callback
            );
        } else {
            this.intervalTimer = this.intervalTimer.filter(
                timer => !(timer.callback === callback && timer.target === target)
            );
        }
    }

    /**
     * 取消所有定时器
     */
    unregisterAll() {
        this.intervalTimer = [];
    }

    private dailyTimers: DailyTimer[] = [];

    /**
     * 注册每日触发器
     * @param time 24小时制,精确到秒
     * 
     * @example
     * registerDailyTrigger('16', ...) 等同于 registerDailyTrigger('16-17', ...)
     * registerDailyTrigger('8-9:00', ...) 等同于 registerDailyTrigger('8', ...)
     * registerDailyTrigger('8:00:01-24', ...)
     */
    registerDailyTrigger(
        time: string,
        callback: ICallback,
        target?: unknown,
        once?: boolean
    ) {
        const timer = new DailyTimer(time, callback, target, once || false);
        this.dailyTimers.push(timer);
    }

    /**
     * 取消每日触发器
     */
    unregisterDailyTrigger(callback: ICallback, target?: unknown) {
        if (typeof target === 'undefined') {
            this.dailyTimers = this.dailyTimers.filter(
                timer => timer.callback !== callback
            );
        } else {
            this.dailyTimers = this.dailyTimers.filter(
                timer => !(timer.callback === callback && timer.target === target)
            );
        }
    }

    /**
     * 取消所有每日触发器
     */
    unregisterAllDailyTrigger() {
        this.dailyTimers = [];
    }

    /**
     * 清除所有定时器和触发器
     */
    clear() {
        this.intervalTimer = [];
        this.dailyTimers = [];
    }

    protected update(dt: number): void {
        for (let index = 0; index < this.intervalTimer.length; index++) {
            const timer = this.intervalTimer[index];
            if (timer.update(dt)) {
                this.intervalTimer.splice(index, 1);
                index--;
            }
        }

        const date = new Date();
        for (let index = 0; index < this.dailyTimers.length; index++) {
            const timer = this.dailyTimers[index];
            if (timer.update(date)) {
                this.dailyTimers.splice(index, 1);
                index--;
            }
        }
    }
}

@ccclass('TimerManager')
export default class TimerManager extends BaseManager {
    private timers: Map<string | number, Timer> = new Map();

    /**
     * 清除所有定时器
     */
    clear() {
        this.timers.forEach((timer) => {
            timer.clear();
        });
        this.timers.clear();
    }

    /**
     * 删除定时器
     * @param key 定时器key
     */
    delete(key: string | number) {
        const timer = this.timers.get(key);
        if (!timer) return;

        this.timers.delete(key);
        timer.clear();
    }

    /**
     * 获取定时器
     * @param key 定时器key
     */
    get(key: string | number): Timer {
        if (this.timers.has(key)) {
            return this.timers.get(key);
        }

        const timer = new Timer();
        this.timers.set(key, timer);
        return timer;
    }

    protected update(dt: number): void {
        this.timers.forEach((timer) => {
            Timer.update(timer, dt);
        });
    }
}
