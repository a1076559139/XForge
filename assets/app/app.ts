import { Game, game } from 'cc';
import { DEBUG, DEV, EDITOR } from 'cc/env';
import Core from '../../extensions/app/assets/Core';
import { IApp } from '../app-builtin/app-admin/executor';
import { appInited, appReady, cccInited, cccReady } from './handle';

export class App extends Core<IApp> {
    protected static _inst: App | undefined;
    static get inst() {
        if (!this._inst) this._inst = new App();
        return this._inst;
    }

    private constructor() {
        super();
    }
}

export const app = App.inst;

if (DEBUG) {
    //@ts-ignore
    window['app'] = app;
    //@ts-ignore
    window['App'] = App;
}

if (!EDITOR || DEV) {
    cccReady && cccReady(app);
    appReady && appReady(app);
    cccInited && game.once(Game.EVENT_ENGINE_INITED, function () { cccInited(app); });
    appInited && app.once(App.EventType.EVENT_APPINIT_FINISHED, function () { appInited(app); });
}