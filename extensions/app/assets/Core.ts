import { Component, EventTarget } from 'cc';
import http from './lib/http/http';
import pipeline from './lib/pipeline/pipeline';
import Queue from './lib/queue/queue';
import Socket from './lib/socket/socket';
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

interface IManager {
    Loader: Omit<typeof LoaderManager, keyof Component>,
    Event: Omit<typeof EventManager, keyof Component>,
    Sound: Omit<typeof SoundManager, keyof Component>,
    Timer: Omit<typeof TimerManager, keyof Component>,
    UI: Omit<typeof UIManager, keyof Component>
}

interface Imanager {
    loader: Omit<LoaderManager, keyof Component>,
    event: Omit<EventManager, keyof Component>,
    sound: Omit<SoundManager<any, any>, keyof Component>,
    timer: Omit<TimerManager, keyof Component>,
    ui: Omit<UIManager<any, any>, keyof Component>
}

interface ICore {
    data: IData,
    config: IConfig,
    manager: Imanager,
    Manager: IManager
}

const EventMap = {};
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
    lib = { task, http, queue: Queue, socket: Socket, storage, pipeline };
    // 数据
    config: T['config'] = {};
    data: T['data'] = {};
    // manager
    Manager: T['Manager'] = {} as any;
    manager: T['manager'] = {} as any;

    constructor(params: T) {
        super();
        Core._inst = this;
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
}

if (!Core.inst) {
    new Core({ config: {}, data: {}, Manager: {}, manager: {} } as any);
}