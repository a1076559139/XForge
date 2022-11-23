import { Game, game } from "cc";
import { DEBUG, DEV, EDITOR } from "cc/env";
import Core from "../../extensions/app/assets/Core";
import { IApp } from '../app-builtin/app-admin/executor';
import { appInited, appReady, cccInited, cccReady } from "./handle";

export class App extends Core<IApp> {
    protected static _inst: App = null;
    static get inst() {
        if (!this._inst) this._inst = new App();
        return this._inst;
    }

    private constructor() {
        super()
    }

    appReady = appReady;
    appInited = appInited;
    cccReady = cccReady;
    cccInited = cccInited;
}

export const app = App.inst;

if (DEBUG) {
    window['app'] = app;
    window['App'] = App;
}

if (!EDITOR || DEV) {
    app.cccReady && app.cccReady();
    app.appReady && app.appReady();
    app.cccInited && game.once(Game.EVENT_ENGINE_INITED, function () { app.cccInited(); });
    app.appInited && app.once(App.EventType.EVENT_APPINIT_FINISHED, function () { app.appInited(); });
}