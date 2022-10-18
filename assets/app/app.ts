import { Game, game } from "cc";
import { DEBUG, EDITOR } from "cc/env";
import Core from "../../extensions/app/assets/Core";
import * as executor from './executor';

export class App extends Core<typeof executor> {
    protected static _inst: App = null;
    static get inst() {
        if (!this._inst) this._inst = new App();
        return this._inst;
    }

    private constructor() {
        super(executor)
    }

    appReady: Function = null;
    appInited: Function = null;
    cccReady: Function = null;
    cccInited: Function = null;
}

export const app = App.inst;

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