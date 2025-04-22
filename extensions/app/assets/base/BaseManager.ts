import { AssetManager, Component, EventTarget, Prefab, Widget, _decorator, error, instantiate, js, path, warn } from 'cc';
import { DEBUG, DEV, EDITOR } from 'cc/env';
import Core from '../Core';
import { Logger } from '../lib/logger/logger';

const { ccclass } = _decorator;

const UserManagerPath = 'UserManager';
const DontRewriteFuns = ['emit', 'on', 'once', 'off', 'targetOff'];

const uuid = new class UUID {
    private index = 0;

    public create(): string {
        if (this.index++ > 10000000) {
            this.index = 0;
        }
        return `${Date.now()}-${this.index}`;
    }
};

const loadBegin = Logger.create('log', '#32cd32', DEV ? '[BaseManager] 下载开始' : '[BaseManager] [下载开始]');

const loadFinish = Logger.create('log', '#00ae9d', DEV ? '[BaseManager] 下载完成' : '[BaseManager] [下载完成]');

const loadError = Logger.create('log', '#ff4757', DEV ? '[BaseManager] 下载失败' : '[BaseManager] [下载失败]');

const initBegin = Logger.create('log', '#3e4145', DEV ? '[BaseManager] 初始化开始' : '[BaseManager] [初始化开始]');

const initFinish = Logger.create('log', '#008080', DEV ? '[BaseManager] 初始化完成' : '[BaseManager] [初始化完成]');

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
            DontRewriteFuns.forEach((funName) => {
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

    /**打印日志 */
    protected get log() {
        if (DEV) {
            return window.console.log.bind(window.console,
                '%c %s %c %s ',
                'background:#4169e1; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #4169e1; color: #fff; font-weight: normal;',
                `[${this._base_manager_name}] LOG ${new Date().toLocaleString()}`,
                'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #4169e1; color: #4169e1; font-weight: normal;'
            );
        }
        return window.console.log.bind(window.console,
            `[${this._base_manager_name}] [LOG] [${new Date().toLocaleString()}]`,
        );
    }

    /**打印警告 */
    protected get warn() {
        if (DEV) {
            return window.console.warn.bind(window.console,
                '%c %s %c %s ',
                'background:#ff7f50; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #ff7f50; color: #fff; font-weight: normal;',
                `[${this._base_manager_name}] WARN ${new Date().toLocaleString()}`,
                'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #ff7f50; color: #ff7f50; font-weight: normal;'
            );
        }
        return window.console.warn.bind(window.console,
            `[${this._base_manager_name}] [WARN] [${new Date().toLocaleString()}]`,
        );
    }

    /**打印错误 */
    protected get error() {
        if (DEV) {
            return window.console.error.bind(window.console,
                '%c %s %c %s ',
                'background:#ff4757; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #ff4757; color: #fff; font-weight: normal;',
                `[${this._base_manager_name}] ERROR ${new Date().toLocaleString()}`,
                'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #ff4757; color: #ff4757; font-weight: normal;'
            );
        }
        return window.console.error.bind(window.console,
            `[${this._base_manager_name}] [ERROR] [${new Date().toLocaleString()}]`,
        );
    }

    /**
     * [系统内置] 事件分发
     */
    public emit(event: string | number, ...data: any[]) {
        this._base_event.emit(event as any, ...data);
    }

    /**
     * [系统内置] 事件监听
     */
    public on(event: string | number, cb: (...any: any[]) => void, target?: any) {
        this._base_event.on(event as any, cb, target);
    }

    /**
     * [系统内置] 事件监听
     */
    public once(event: string | number, cb: (...any: any[]) => void, target?: any) {
        this._base_event.once(event as any, cb, target);
    }

    /**
     * [系统内置] 事件移除监听
     */
    public off(event: string | number, cb?: (...any: any[]) => void, target?: any) {
        this._base_event.off(event as any, cb, target);
    }

    /**
     * [系统内置] 事件移除监听
     */
    public targetOff(target: any) {
        this._base_event.targetOff(target);
    }

    /***********************************静态***********************************/
    /**
     * 框架内置Manager的数量
     * @private
     */
    public static get sysMgrCount() {
        return 5;
    }

    /**
     * 获得初始化资源的数量(包括sysMgrCount)
     * @private
     */
    public static getTotalAssetNum(bundle: AssetManager.Bundle) {
        let count = this.sysMgrCount;

        if (!bundle) return count;

        const array = bundle.getDirWithPath('/', Prefab) as { uuid: string, path: string, ctor: Function }[];

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
    public static getUserAssetUrls(bundle: AssetManager.Bundle) {
        const pathArr: string[] = [];

        if (!bundle) return pathArr;

        const array = bundle.getDirWithPath('/', Prefab) as { uuid: string, path: string, ctor: Function }[];

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
    public static init(
        bundle: AssetManager.Bundle,
        progress: (completeAsset: Number, totalAsset: Number) => any,
        complete: (totalAsset: Number) => any) {
        const urls = this.getUserAssetUrls(bundle);

        const totalAsset = urls.length + this.sysMgrCount;
        let completeAsset = 0;

        const onProgress = function (next: Function, manager: BaseManager) {
            if (DEBUG) {
                const startTime = window?.performance?.now ? performance.now() : Date.now();
                initBegin(manager.managerName);
                return function () {
                    manager.onInited();
                    if (DEBUG) {
                        const endTime = window?.performance?.now ? performance.now() : Date.now();
                        initFinish(`${manager.managerName} 耗时:${(endTime - startTime).toFixed(6)} ms`);
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
        const UserManagerRoot = Core.inst.manager.ui.root.getChildByPath(UserManagerPath);
        urls.forEach(function (url) {
            loadUserMgrTask.add(function (next, retry) {
                if (DEBUG) {
                    const managerName = path.basename(url);
                    const startTime = window?.performance?.now ? performance.now() : Date.now();
                    loadBegin(managerName);
                    bundle.load(url, Prefab, function (err, prefab: Prefab) {
                        if (err || !prefab) {
                            loadError(managerName, '重试...');
                            retry(1);
                        } else {
                            const endTime = window?.performance?.now ? performance.now() : Date.now();
                            loadFinish(`${managerName} 耗时:${(endTime - startTime).toFixed(6)} ms`);
                            const node = instantiate(prefab);
                            node.parent = UserManagerRoot;
                            node.active = true;
                            userMgrList.push(node.getComponent(BaseManager));
                            next();
                        }
                    });
                    return;
                }
                bundle.load(url, Prefab, function (err, prefab: Prefab) {
                    if (err || !prefab) {
                        loadError(path.basename(url), '重试...');
                        retry(1);
                    } else {
                        const node = instantiate(prefab);
                        node.parent = UserManagerRoot;
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