import { EventTarget, Game, game } from 'cc';
import { DEBUG, EDITOR } from 'cc/env';
import * as executor from '../../../assets/app/executor';
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

export class App extends EventTarget {
    /**
     * 版本号规则：破坏性.新功能.修复BUG
     */
    appVersion = '1.0.0';

    static EventType = EventType;

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

    // 库
    lib = executor.lib;
    // 数据
    config = executor.config;
    data = executor.data;
    // manager
    Manager = executor.Manager;
    manager = executor.manager;

    appReady: Function = null;
    appInited: Function = null;
    cccReady: Function = null;
    cccInited: Function = null;
}

export const app: App = new App();

if (DEBUG) {
    window['app'] = app;
    window['App'] = App;
}

if (!EDITOR) {
    app.cccReady && app.cccReady();
    app.appReady && app.appReady();
    game.once(Game.EVENT_ENGINE_INITED, function () { app.cccInited && app.cccInited(); });
    app.once(App.EventType.EVENT_APPINIT_FINISHED, function () { app.appInited && app.appInited(); });
}