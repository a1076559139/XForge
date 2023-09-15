import { Component, _decorator } from 'cc';
import BaseManager from '../../base/BaseManager';
const { ccclass } = _decorator;
class Time {
    private _beginHour: number = 0;
    private _beginMinute: number = 0;
    private _beginSecond: number = 0;
    private _endHour: number = 0;
    private _endMinute: number = 0;
    private _endSecond: number = 0;

    get beginTime() {
        const date = new Date();
        date.setHours(this._beginHour);
        date.setMinutes(this._beginMinute);
        date.setSeconds(this._beginSecond);
        return date.getTime();
    }
    get endTime() {
        const date = new Date();
        date.setHours(this._endHour);
        date.setMinutes(this._endMinute);
        date.setSeconds(this._endSecond);
        return date.getTime();
    }

    checkCallback = 0;
    callback: Function = null;
    target: any = null;

    constructor(time: string, callback: Function, target?: any) {
        this.callback = callback;
        this.target = target;

        const [time0, time1] = time.split('-');

        const time0Array = time0.split(':');
        this._beginHour = Number(time0Array[0]) || 0;
        this._beginMinute = Number(time0Array[1] || 0) || 0;
        this._beginSecond = Number(time0Array[2] || 0) || 0;

        if (time1) {
            const time1Array = time1.split(':');
            this._endHour = Number(time1Array[0]) || 0;
            this._endMinute = Number(time1Array[1] || 0) || 0;
            this._endSecond = Number(time1Array[2] || 0) || 0;
        } else {
            this._endHour = this._beginHour;
            this._endMinute = this._beginMinute;
            this._endSecond = this._beginSecond;
        }
    }
}

interface ITimer {
    /**
     * 重复定时器
     */
    schedule(callback: any, interval?: number, repeat?: number, delay?: number): void
    /**
     * 单次定时器
     */
    scheduleOnce(callback: any, delay?: number): void
    /**
     * 取消指定定时器
     */
    unschedule(callback_fn: any): void
    /**
     * 取消所有普通定时器
     */
    unscheduleAllCallbacks(): void
    /**
     * 注册每日触发器
     * @param time '8:00:01-9:00' 24小时制
     * @param time '8-9' 24小时制
     */
    registerDailyTrigger(time: string, callback: Function, target?: any): void
    /**
     * 取消每日触发器
     */
    unregisterDailyTrigger(callback: Function): void
}

// @ccclass
class Timer extends Component implements ITimer {
    private times: Time[] = [];

    registerDailyTrigger(time: string, callback: Function, target?: any) {
        this.times.push(new Time(time, callback, target));
    }

    unregisterDailyTrigger(callback: Function) {
        for (let index = 0; index < this.times.length; index++) {
            const time = this.times[index];
            if (time.callback === callback) {
                this.times.splice(index, 1);
                break;
            }
        }
    }

    protected update() {
        const date = new Date();
        const dateTime = date.getTime();
        const dateDay = date.getDay();
        this.times.forEach(function (time) {
            if (time.checkCallback !== dateDay && time.beginTime <= dateTime && time.endTime >= dateTime) {
                time.checkCallback = dateDay;
                time.callback.call(time.target);
            }
        });
    }
}

@ccclass('TimerManager')
export default class TimerManager extends BaseManager {

    private timers: Map<string | number, Timer> = new Map();

    clear() {
        this.timers.forEach((timer) => {
            timer.destroy();
        });
        this.timers.clear();
    }

    delete(rootName: string | number) {
        const timer = this.timers.get(rootName);
        if (timer) {
            this.timers.delete(rootName);
            timer.destroy();
        }
    }

    get(rootName: string | number): ITimer {
        if (this.timers.has(rootName)) {
            return this.timers.get(rootName);
        }

        const timer = this.node.addComponent(Timer);
        this.timers.set(rootName, timer);
        return timer;
    }
}
