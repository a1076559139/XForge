import { AssetManager, Component, EventTarget, Prefab, Widget, _decorator, assetManager, error, find, instantiate, js, log, path, settings, warn } from 'cc';
import { DEBUG, EDITOR } from 'cc/env';
import Core from '../Core';

const { ccclass } = _decorator;

const UserManagerRoot = 'Root2D/UserManager';
const DotReWriteFuns = ['emit', 'on', 'once', 'off', 'targetOff'];

const uuid = new class UUID {
    private index = 0;

    public create(): string {
        if (this.index++ > 10000000) {
            this.index = 0;
        }
        return `${Date.now()}-${this.index}`;
    }
};

function black(arg1: string, arg2: string) {
    log(
        `%c ${arg1} %c ${arg2} %c`,
        'background:#3e4145 ; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #3e4145; color: #fff;',
        'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #3e4145; color: #3e4145;',
        'background:transparent'
    );
}
function yellow(arg1: string, arg2: string) {
    log(
        `%c ${arg1} %c ${arg2} %c`,
        'background:#dea32c ; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #dea32c; color: #fff;',
        'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #dea32c; color: #dea32c;',
        'background:transparent'
    );
}
function green(arg1: string, arg2: string) {
    log(
        `%c ${arg1} %c ${arg2} %c`,
        'background:#00ae9d ; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #00ae9d; color: #fff;',
        'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #00ae9d; color: #00ae9d;',
        'background:transparent'
    );
}
function orange(arg1: string, arg2: string) {
    log(
        `%c ${arg1} %c ${arg2} %c`,
        'background:#ff7f50 ; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #ff7f50; color: #fff;',
        'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #ff7f50; color: #ff7f50;',
        'background:transparent'
    );
}
function red(arg1: string, arg2: string) {
    log(
        `%c ${arg1} %c ${arg2} %c`,
        'background:#ff4757 ; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #ff4757; color: #fff;',
        'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #ff4757; color: #ff4757;',
        'background:transparent'
    );
}

@ccclass('BaseManager')
export default class BaseManager extends Component {
    // 事件管理器
    private _base_event: EventTarget = new EventTarget();

    // manager名字
    private _base_manager_name: string = js.getClassName(this);
    public get managerName() {
        return this._base_manager_name;
    }

    constructor() {
        super();

        if (EDITOR) {
            DotReWriteFuns.forEach((funName) => {
                if (BaseManager.prototype[funName] !== this[funName]) {
                    warn(`[${this._base_manager_name}] 不应该重写父类方法{${funName}}`);
                }
            });
        }

        if (this._base_manager_name !== 'Manager' && this._base_manager_name.slice(-7) === 'Manager') {
            const managerName = this._base_manager_name.slice(0, - 7);
            Core.inst.Manager[managerName] = this.constructor;
            Core.inst.manager[managerName.toLocaleLowerCase()] = this;
        } else if (EDITOR) {
            error(`[${this._base_manager_name}] manager命名错误(应为 xxxxManager 以Manager结尾)`);
        } else if (DEBUG) {
            error(`[${this._base_manager_name}] manager命名错误(应为 xxxxManager 以Manager结尾)`);
        }
    }

    // 用来初始化组件或节点的一些属性，当该组件被第一次添加到节点上或用户点击了它的 Reset 菜单时调用。这个回调只会在编辑器下调用。
    resetInEditor() {
        const widget = this.node.getComponent(Widget) || this.node.addComponent(Widget);
        widget.isAlignBottom = true;
        widget.isAlignLeft = true;
        widget.isAlignRight = true;
        widget.isAlignTop = true;
        widget.top = 0;
        widget.left = 0;
        widget.right = 0;
        widget.bottom = 0;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
    }

    /**
     * [无序] 自身初始化完成, init执行完毕后被调用
     */
    protected onInited() {
    }

    /**
     * [无序] 所有manager初始化完成
     */
    protected onFinished() {
    }

    /**
     * [无序] 初始化manager，在初始化完成后，调用finish方法
     * @param {Function} finish 
     */
    protected init(finish?: Function) {
        finish && finish();
    }

    protected createUUID() {
        return uuid.create();
    }

    protected log(...args: any[]) {
        log(
            `%c ${this._base_manager_name} %c %s %c`,
            'background:#1e90ff ; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #1e90ff; color: #fff;',
            'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #1e90ff; color: #1e90ff;',
            args.join(' '),
            'background:transparent'
        );
    }

    protected warn(...args: any[]) {
        log(
            `%c ${this._base_manager_name} %c %s %c`,
            'background:#eccc68 ; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #eccc68; color: #fff;',
            'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #eccc68; color: #eccc68;',
            args.join(' '),
            'background:transparent'
        );
    }

    protected error(...args: any[]) {
        error(
            `%c ${this._base_manager_name} %c %s %c`,
            'background:#ff4757 ; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #ff4757; color: #fff;',
            'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #ff4757; color: #ff4757;',
            args.join(' '),
            'background:transparent'
        );
    }

    public emit(event: string | number, ...data: any[]) {
        this._base_event.emit(event as any, ...data);
    }

    public on(event: string | number, cb: (...any: any[]) => void, target?: any) {
        this._base_event.on(event as any, cb, target);
    }

    public once(event: string | number, cb: (...any: any[]) => void, target?: any) {
        this._base_event.once(event as any, cb, target);
    }

    public off(event: string | number, cb?: (...any: any[]) => void, target?: any) {
        this._base_event.off(event as any, cb, target);
    }

    public targetOff(target: any) {
        this._base_event.targetOff(target);
    }

    /***********************************静态***********************************/
    /**
     * 将串式命名转成驼峰命名
     * @param str 串式字符串
     * @param lower 首字母是否小写(默认大写)
     * @returns 
     */
    public static stringCase(str: string, lower = false) {
        str = str.replace(/-/g, '_');
        const arr = str.split('_');

        return arr.map(function (str, index) {
            if (index === 0 && lower) {
                return str.charAt(0).toLocaleLowerCase() + str.slice(1);
            }
            return str.charAt(0).toLocaleUpperCase() + str.slice(1);
        }).join('');
    }

    /**
     * 将驼峰命名转成串式命名
     * @param str 驼峰字符串
     * @returns 
     */
    public static stringCaseNegate(str: string) {
        return str.replace(/[A-Z]/g, (searchStr, startIndex) => {
            if (startIndex === 0) {
                return searchStr.toLocaleLowerCase();
            } else {
                return '-' + searchStr.toLocaleLowerCase();
            }
        });
    }
    /**
     * manager asset bundle
     */
    private static bundle: AssetManager.Bundle = null;

    /**
     * 系统内置manager的数量
     * @private
     */
    public static get sysMgrCount() {
        return 5;
    }

    /**
     * 初始化操作
     * @private
     */
    public static init(bundleName: string, onFinish?: Function) {
        // 避免game.restart()时读取错误的缓存
        // if (this.bundle) return onFinish && onFinish();
        this.bundle = null;
        const projectBundles = settings.querySettings('assets', 'projectBundles') as string[];
        if (projectBundles.indexOf(bundleName) === -1) return onFinish && onFinish();

        // 一定会加载成功
        Core.inst.lib.task.execute((retry) => {
            assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) return retry(1);
                this.bundle = bundle;
                onFinish && onFinish();
            });
        });
    }

    /**
     * 获得初始化资源的数量(包括sysMgrCount)
     * @private
     */
    public static getTotalAssetNum() {
        let count = this.sysMgrCount;

        if (!this.bundle) return count;

        const array = this.bundle.getDirWithPath('/', Prefab) as { uuid: string, path: string, ctor: Function }[];

        array.forEach(function (item) {
            if (item.path.endsWith('Manager')) {
                count++;
            }
        });

        return count;
    }

    /**
     * 获得初始化资源的数量
     * @private
     */
    public static getUserAssetUrls() {
        const pathArr: string[] = [];

        if (!this.bundle) return pathArr;

        const array = this.bundle.getDirWithPath('/', Prefab) as { uuid: string, path: string, ctor: Function }[];

        array.forEach(function (item) {
            if (item.path.endsWith('Manager')) {
                pathArr.push(item.path);
            }
        });

        return pathArr;
    }

    /**
     * 静态方法，初始化manager，该方法必须在场景初始化完毕之后调用
     * @private
     */
    public static initManagers(progress: (completeAsset: Number, totalAsset: Number) => any, complete: (totalAsset: Number) => any) {
        const bundle = this.bundle;
        const urls = this.getUserAssetUrls();

        const totalAsset = urls.length + this.sysMgrCount;
        let completeAsset = 0;

        const onProgress = function (next: Function, manager: BaseManager) {
            if (DEBUG) {
                const startTime = window?.performance?.now ? performance.now() : Date.now();
                black('BaseManager', `[初始化开始] ${manager.managerName}`);
                return function () {
                    manager.onInited();
                    if (DEBUG) {
                        const endTime = window?.performance?.now ? performance.now() : Date.now();
                        green(manager.managerName, `[初始化完成] ${(endTime - startTime).toFixed(6)} ms`);
                    }
                    progress && progress(++completeAsset, totalAsset);
                    next();
                };
            }
            return function () {
                manager.onInited();
                progress && progress(++completeAsset, totalAsset);
                next();
            };
        };

        // 用户manager(动态添加)
        const userMgrList: BaseManager[] = [];
        // 系统manager(静态内置)
        const sysMgrList: BaseManager[] = [Core.inst.manager.event, Core.inst.manager.timer, Core.inst.manager.loader, Core.inst.manager.ui, Core.inst.manager.sound] as any as BaseManager[];

        // 初始化系统manager
        const initSysMgrTask = Core.inst.lib.task.createASync();
        sysMgrList.forEach(function (manager: BaseManager) {
            initSysMgrTask.add(function (next) {
                manager.init(onProgress(next, manager));
            });
        });

        // 加载用户manager
        const loadUserMgrTask = Core.inst.lib.task.createASync();
        const userManagerRoot = find(UserManagerRoot);
        urls.forEach(function (url) {
            loadUserMgrTask.add(function (next, retry) {
                if (DEBUG) {
                    const managerName = path.basename(url);
                    const startTime = window?.performance?.now ? performance.now() : Date.now();
                    yellow('BaseManager', `[下载开始] ${managerName}`);
                    bundle.load(url, Prefab, function (err, prefab: Prefab) {
                        if (err || !prefab) {
                            red('BaseManager', `[initManager] load ${url} fail, retry...`);
                            retry(1);
                        } else {
                            const endTime = window?.performance?.now ? performance.now() : Date.now();
                            orange(managerName, `[下载完成] ${(endTime - startTime).toFixed(6)} ms`);
                            const node = instantiate(prefab);
                            node.parent = userManagerRoot;
                            node.active = true;
                            userMgrList.push(node.getComponent(BaseManager));
                            next();
                        }
                    });
                    return;
                }
                bundle.load(url, Prefab, function (err, prefab: Prefab) {
                    if (err || !prefab) {
                        red('BaseManager', `[initManager] load ${url} fail, retry...`);
                        retry(1);
                    } else {
                        const node = instantiate(prefab);
                        node.parent = userManagerRoot;
                        node.active = true;
                        userMgrList.push(node.getComponent(BaseManager));
                        next();
                    }
                });
            });
        });

        Core.inst.lib.task.createAny()
            .add([
                next => initSysMgrTask.start(next),
                next => loadUserMgrTask.start(next),
            ])
            .add(function (next) {
                Core.emit(Core.EventType.EVENT_SYS_MANAGER_INITED);
                next();
            })
            .add(function (next) {
                // 初始化用户manager
                const initUserMgrTask = Core.inst.lib.task.createASync();
                userMgrList.forEach(manager => {
                    initUserMgrTask.add(function (next) {
                        manager.init(onProgress(next, manager));
                    });
                });
                initUserMgrTask.start(next);
            })
            .add(function (next) {
                Core.emit(Core.EventType.EVENT_USER_MANAGER_INITED);
                Core.emit(Core.EventType.EVENT_MANAGER_INITED);
                next();
            })
            .add(function (next) {
                // 所有manager初始化完成后，触发回调
                sysMgrList.forEach(function (manager) {
                    manager.onFinished();
                });
                userMgrList.forEach(function (manager) {
                    manager.onFinished();
                });
                next();
            })
            .start(function () {
                Core.emit(Core.EventType.EVENT_MANAGER_FINISHED);
                complete && complete(totalAsset);
            });
    }

}