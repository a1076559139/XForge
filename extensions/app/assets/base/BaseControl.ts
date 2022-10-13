/**
 * 所有Control的父类
 * 不是每个view都非要有一个对应的Control
 * 
 * 作用：
 * 1、作为对外输出，Control内部可以新建变量和方法，在外部(通过XXXControl.inst调用)变量和方法会自动变为只读。
 * 2、Control内部额外有一个emit方法，用来发射事件，这个方法在其它任何地方都是无法访问的。
 * 每个View可以通过继承BaseView.BindControl(Control)来绑定一个Control，
 * 绑定后在View脚本内部可以通过this.control访问到这个Control实例，与inst调用不同的是，它是不受限的(属性等都不是只读)，
 * 而且可以通过this.control中的on、once、off来接收和关闭接收Control中emit的事件
 */
import { EventTarget } from 'cc';

export interface IBaseControl<T, E> {
    new(): SuperBaseControl<E>
    readonly inst: Readonly<T>
    readonly Event: E
}

// public static getInst<T extends BaseControl>(this: new () => T): T {
//     if ((<any>this)._base_inst === null) {
//         (<any>this)._base_inst = new this();
//     }
//     return (<any>this)._base_inst;
// }
class SuperBaseControl<E> {
    private static _base_inst = null;
    public static get inst() {
        if (this._base_inst === null) {
            this._base_inst = new this() as any;
        }
        return this._base_inst;
    }

    private event = new EventTarget();

    protected emit(key: E[keyof E], arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any): void;
    protected emit(...args: any[]): void {
        return this.event.emit.call(this.event, ...args);
    }

    private on(...args: any[]): void {
        return this.event.on.call(this.event, ...args);
    }

    private once(...args: any[]): void {
        return this.event.once.call(this.event, ...args);
    }

    private off(...args: any[]): void {
        return this.event.off.call(this.event, ...args);
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