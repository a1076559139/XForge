/**
 * 所有Control的父类
 * 
 * 作用：
 * 1、作为对外输出，Control内部可以新建变量和方法，在外部(通过XXXControl.inst调用)变量和方法会自动变为只读。
 * 2、Control内部额外有一个emit和call方法，用来发射事件，这个方法在其它任何地方都是无法访问的。区别在于call方法只会执行第一个注册的事件并获得返回值。
 * 每个View可以通过继承BaseView.BindControl(Control)来绑定一个Control，
 * 绑定后在View脚本内部可以通过this.control访问到这个Control实例，与inst调用不同的是，它是不受限的(属性等都不是只读)，
 * 而且可以通过this.control中的on、once、off来接收和关闭接收Control中emit或call的事件
 */

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

export interface IBaseControl<T, E> {
    new(): SuperBaseControl<E>
    readonly inst: Readonly<T>
    readonly Event: E
}

class SuperBaseControl<E> {
    private static _base_inst = null;
    public static get inst() {
        if (this._base_inst === null) {
            this._base_inst = new this() as any;
        }
        return this._base_inst;
    }

    private event = new EventEmitter();

    protected call(key: E[keyof E], ...args: any[]): any {
        return this.event.call.call(this.event, key, args);
    }

    protected emit(key: E[keyof E], ...args: any[]): void {
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
}

export default function BaseControl<T, E>(Event?: E) {
    return class BaseControl extends SuperBaseControl<E> {
        public static Event: E = Event;
    } as IBaseControl<T, E>;
}