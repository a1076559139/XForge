import { Component, EventTarget } from 'cc';
import EventManager from './manager/event/EventManager';
import SoundManager from './manager/sound/SoundManager';
import TimerManager from './manager/timer/TimerManager';
import UIManager from './manager/ui/UIManager';
// @ts-ignore
// 忽略报错

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

const EventMap = {};

type ILib = Object;
type IData = Object;
type IConfig = Object;

interface IManager {
    Event: Omit<typeof EventManager, keyof Component>,
    Sound: Omit<typeof SoundManager, keyof Component>,
    Timer: Omit<typeof TimerManager, keyof Component>,
    UI: Omit<typeof UIManager, keyof Component>
}

interface Imanager {
    event: Omit<EventManager, keyof Component>,
    sound: Omit<SoundManager<any, any>, keyof Component>,
    timer: Omit<TimerManager, keyof Component>,
    ui: Omit<UIManager<any, any>, keyof Component>
}

interface ICore {
    lib: ILib,
    data: IData,
    config: IConfig,
    manager: Imanager,
    Manager: IManager
}

export default class Core<T extends ICore> extends EventTarget {
    /**
     * 版本号规则：破坏性.新功能.修复BUG
     */
    static appVersion = '1.0.0';

    static EventType = EventType;

    protected static _inst: Core<ICore> = null;
    static get inst() {
        return this._inst;
    }

    // 库
    lib: T['lib'] = {};
    // 数据
    config: T['config'] = {};
    data: T['data'] = {};
    // manager
    Manager: T['Manager'] = {} as any;
    manager: T['manager'] = {} as any;

    constructor(params: T) {
        super();
        Core._inst = this;
        this.lib = params.lib;
        this.data = params.data;
        this.config = params.config;
        this.Manager = params.Manager;
        this.manager = params.manager;
    }

    on(event: keyof typeof EventType, callback: (...any: any[]) => void, target?: any): any {
        if (EventMap[event]) callback.call(target);
        super.on(event, callback, target);
    }

    once(event: keyof typeof EventType, callback: Function, target?: any): any {
        if (EventMap[event]) {
            callback.call(target);
        } else {
            super.once(event, callback as any, target);
        }
    }

    emit(event: keyof typeof EventType, ...args: any[]): any {
        EventMap[event] = true;
        super.emit(event, ...args);
    }

    log(str: string, ...args: any[]) { console.log(`[app] [log] ${str}`, ...args); }
    warn(str: string, ...args: any[]) { console.warn(`[app] [warn] ${str}`, ...args); }
    error(str: string, ...args: any[]) { console.error(`[app] [error] ${str}`, ...args); }
}