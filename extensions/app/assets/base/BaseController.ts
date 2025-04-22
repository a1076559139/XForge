import { DEV } from 'cc/env';
import { IReadOnly } from '../../../../assets/app-builtin/app-admin/executor';
import { Logger } from '../lib/logger/logger';

class CallbackInfo {
    public callback: Function = null;
    public target: unknown = null;
    public once = false;

    public constructor(callback: Function, target: unknown = null, once: boolean = false) {
        this.callback = callback;
        this.target = target;
        this.once = once;
    }
}

type Parameters<T extends (...args: any) => any> = T extends (...args: infer P) => any ? P : any;
type AnyFunc = (...args: any[]) => any;

class CallbackList {
    private callbacks: CallbackInfo[] = [];

    public size() {
        return this.callbacks.length;
    }

    public add(callback: Function, target: unknown = null, once: boolean = false) {
        this.callbacks.push(new CallbackInfo(callback, target, once));
    }

    public emit(args: any[]) {
        for (let index = 0; index < this.callbacks.length; index++) {
            const info = this.callbacks[index];
            // 先移除
            if (info.once) {
                this.callbacks.splice(index, 1);
                --index;
            }
            if (info.callback) {
                info.callback.apply(info.target, args);
            }
        }
    }

    public call(args: any[]) {
        if (this.callbacks.length === 0) return;
        const info = this.callbacks[0];

        // 先移除
        if (info.once) this.callbacks.splice(0, 1);
        if (!info.callback) return;

        return info.callback.apply(info.target, args);
    }

    public remove(callback: Function, target: unknown = null) {
        for (let index = this.callbacks.length - 1; index >= 0; index--) {
            const info = this.callbacks[index];
            if (info.callback !== callback || info.target !== target) continue;
            this.callbacks.splice(index, 1);
        }
    }

    public removeByCallback(callback: Function) {
        for (let index = this.callbacks.length - 1; index >= 0; index--) {
            const info = this.callbacks[index];
            if (info.callback !== callback) continue;
            this.callbacks.splice(index, 1);
        }
    }

    public removeByTarget(target: unknown) {
        for (let index = this.callbacks.length - 1; index >= 0; index--) {
            const info = this.callbacks[index];
            if (info.target !== target) continue;
            this.callbacks.splice(index, 1);
        }
    }
}

class EventEmitter {
    private listeners: { [key in string]: CallbackList } = {};

    public on(event: string | number, cb: (...data: any[]) => void, target?: unknown) {
        if (!event.toString() || !cb) return;
        if (!this.listeners[event]) this.listeners[event] = new CallbackList();
        this.listeners[event].add(cb, target);
    }

    public once(event: string | number, cb: (...data: any[]) => void, target?: unknown) {
        if (!event.toString() || !cb) return;
        if (!this.listeners[event]) this.listeners[event] = new CallbackList();
        this.listeners[event].add(cb, target, true);
    }

    public off(event: string | number, cb: (...data: any[]) => void, target?: unknown) {
        if (!event.toString() || !cb) return;
        if (!this.listeners[event]) return;

        this.listeners[event].remove(cb, target);
    }

    public targetOff(target?: unknown) {
        if (!target) return;

        for (const key in this.listeners) {
            if (Object.prototype.hasOwnProperty.call(this.listeners, key)) {
                const element = this.listeners[key];
                element.removeByTarget(target);
            }
        }
    }

    public emit(event: string | number, args: any[]) {
        if (!event.toString()) return;
        if (!this.listeners[event]) return;
        this.listeners[event].emit(args);
    }

    public call(event: string | number, args: any[]) {
        if (!event.toString()) return;
        if (!this.listeners[event]) return;
        return this.listeners[event].call(args);
    }
}

export interface IBaseController<C, T extends { [key in string]?: AnyFunc }> {
    readonly inst: Readonly<C>

    //用于类型提示推导////////////////
    new(): SuperBaseController<T>//
    ///////////////////////////////
}

class SuperBaseController<T extends { [key in string]?: AnyFunc }> {
    //用于类型提示推导//
    private t: T;////
    /////////////////

    private event = new EventEmitter();

    /**获取第一个事件回调的返回值 */
    protected call<K extends keyof T>(key: K, ...args: Parameters<T[K]>): ReturnType<T[K]> {
        return this.event.call.call(this.event, key, args);
    }

    /**发射事件 */
    protected emit<K extends keyof T>(key: K, ...args: Parameters<T[K]>): void {
        return this.event.emit.call(this.event, key, args);
    }

    private on(...args: any[]): void {
        return this.event.on.apply(this.event, args);
    }

    private once(...args: any[]): void {
        return this.event.once.apply(this.event, args);
    }

    private off(...args: any[]): void {
        return this.event.off.apply(this.event, args);
    }

    private targetOff(target: any): void {
        return this.event.targetOff.call(this.event, target);
    }

    /**打印日志 */
    protected get log(): Function {
        return Logger.create('log', '#4682b4', DEV ? `[${this['constructor'].name}] LOG` : `[${this['constructor'].name}] [LOG]`);
    }

    /**打印警告 */
    protected get warn(): Function {
        return Logger.create('warn', '#ff7f50', DEV ? `[${this['constructor'].name}] WARN` : `[${this['constructor'].name}] [WARN]`);
    }

    /**打印错误 */
    protected get error(): Function {
        return Logger.create('error', '#ff4757', DEV ? `[${this['constructor'].name}] ERROR` : `[${this['constructor'].name}] [ERROR]`);
    }
}

export default function BaseController<C, T extends { [key in string]?: AnyFunc } = any>() {
    return class BaseController extends SuperBaseController<T> {
        /**
         * 控制器事件
         */
        public static Event: { [key in keyof T]: key } = new Proxy({} as any, {
            get: function (target, key) {
                if (target[key]) return target[key];
                target[key] = key;
                return key;
            }
        });

        private static _base_inst: IReadOnly<C> = null;
        /**
         * 控制器单例
         * - 尽量使用app.controller，可以避免因跨Bundle引用导致的问题，也可以避免Controller之间循环引用的问题
         */
        public static get inst() {
            return this._base_inst;
        }

        constructor() {
            super();
            BaseController._base_inst = this as any;
        }
    };
}