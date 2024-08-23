import { Component, EventTarget, js } from 'cc';
import { DEV, EDITOR } from 'cc/env';
import * as debug from './lib/debug/debug';
import storage from './lib/storage/storage';
import task from './lib/task/task';
import EventManager from './manager/event/EventManager';
import LoaderManager from './manager/loader/LoaderManager';
import SoundManager from './manager/sound/SoundManager';
import TimerManager from './manager/timer/TimerManager';
import UIManager from './manager/ui/UIManager';

enum EventType {
    /**AppInit准备完毕 */
    EVENT_APPINIT_FINISHED = 'EVENT_APPINIT_FINISHED',
    /**系统Manager初始化完毕 */
    EVENT_SYS_MANAGER_INITED = 'EVENT_SYS_MANAGER_INITED',
    /**用户Manager初始化完毕 */
    EVENT_USER_MANAGER_INITED = 'EVENT_USER_MANAGER_INITED',
    /**所有Manager初始化完毕 */
    EVENT_MANAGER_INITED = 'EVENT_MANAGER_INITED',
    /**所有Manager准备完毕 */
    EVENT_MANAGER_FINISHED = 'EVENT_MANAGER_FINISHED'
}

type IData = { [key in string]: any };
type IConfig = { [key in string]: any };
type IStore = { [key in string]: any };

interface ITypeofManager {
    Loader: Omit<typeof LoaderManager, keyof Component>,
    Event: Omit<typeof EventManager, keyof Component>,
    Sound: Omit<typeof SoundManager, keyof Component>,
    Timer: Omit<typeof TimerManager, keyof Component>,
    UI: Omit<typeof UIManager, keyof Component>
}

interface IManager {
    loader: Omit<LoaderManager, keyof Component>,
    event: Omit<EventManager, keyof Component>,
    sound: Omit<SoundManager<any, any>, keyof Component>,
    timer: Omit<TimerManager, keyof Component>,
    ui: Omit<UIManager<any, any>, keyof Component>
}

interface ICore {
    data: IData,
    config: IConfig,
    store: IStore,
    manager: IManager,
    Manager: ITypeofManager
}

const EventMap = {};
const Lib = { task, storage, debug };
const Config = {};
const Data = {};
const Store = {};
const Manager = {};
const manager = {};
const eventTarget = new EventTarget();
export default class Core<T extends ICore> {
    static EventType = EventType;

    protected static _inst: Core<ICore> = null;
    static get inst() {
        if (!this._inst) this._inst = new Core();
        return this._inst;
    }

    lib = Lib;
    config: T['config'] = null;
    data: T['data'] = null;
    store: T['store'] = null;
    Manager: T['Manager'] = null;
    manager: T['manager'] = null;

    constructor() {
        this.config = Config;
        this.data = Data;
        this.store = Store;
        this.Manager = Manager as any;
        this.manager = manager as any;
        if (!EDITOR || DEV) {
            if (this.constructor !== Core && !js.getClassById('App')) {
                js.setClassAlias(this.constructor as any, 'App');
            }
        }
    }

    on(event: keyof typeof EventType, callback: (...any: any[]) => void, target?: any): any {
        if (EventMap[event]) callback.call(target);
        eventTarget.on(event, callback, target);
    }

    once(event: keyof typeof EventType, callback: Function, target?: any): any {
        if (EventMap[event]) {
            callback.call(target);
        } else {
            eventTarget.once(event, callback as any, target);
        }
    }

    off(event: keyof typeof EventType, callback: (...any: any[]) => void, target?: any): any {
        eventTarget.off(event, callback, target);
    }

    targetOff(target: any) {
        eventTarget.targetOff(target);
    }

    /**
     * 请不要手动调用
     */
    static emit(event: keyof typeof EventType, ...args: any[]): any {
        EventMap[event] = true;
        eventTarget.emit(event, ...args);
    }
}