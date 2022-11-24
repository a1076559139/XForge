import { AssetManager, assetManager, Component, error, EventTarget, find, instantiate, js, log, Node, Prefab, warn, Widget, _decorator } from 'cc';
import { DEBUG, EDITOR } from 'cc/env';
import Core from '../Core';

const { ccclass, property } = _decorator;

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

const BundleName = 'app-manager';

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
                    warn(`[${this._base_manager_name}] [warn] 不应该重写父类方法{${funName}}`);
                }
            });
        }

        if (this._base_manager_name !== 'Manager' && this._base_manager_name.slice(-7) === 'Manager') {
            const managerName = this._base_manager_name.slice(0, - 7);
            Core.inst.Manager[managerName] = this.constructor;
            Core.inst.manager[managerName.toLowerCase()] = this;
        } else if (EDITOR) {
            error(`[${this._base_manager_name}] [error] manager命名错误(应为 xxxxManager 以Manager结尾)`);
        } else if (DEBUG) {
            error(`[${this._base_manager_name}] [error] manager命名错误(应为 xxxxManager 以Manager结尾)`);
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
    protected init(finish?: Function, { bundle, preload }: { bundle?: string, preload?: string[] } = {}) {
        // 无预加载
        if (!preload || !preload.length) {
            return finish && finish();
        }

        // 预加载
        if (bundle) {
            assetManager.loadBundle(bundle, function (err, bundle) {
                if (err) return;
                preload.forEach((path: string) => {
                    bundle.preload(path);
                });
            });
        } else {
            preload.forEach(function (name) {
                assetManager.loadBundle(name, function (err, bundle) {
                    if (err) return;
                    bundle.preloadDir('/');
                });
            })
        }

        finish && finish();
    }

    protected createUUID() {
        return uuid.create();
    }

    protected log(str: any, ...args: any) {
        console.log(`[${this._base_manager_name}] [log] ${str}`, ...args);
    }
    protected warn(str: any, ...args: any) {
        console.warn(`[${this._base_manager_name}] [warn] ${str}`, ...args);
    }
    protected error(str: any, ...args: any) {
        console.error(`[${this._base_manager_name}] [error] ${str}`, ...args);
    }

    public emit(event: string | number, ...data) {
        this._base_event.emit(event as any, ...data);
    }

    public on(event: string | number, cb: (...any: any[]) => void, target?: any) {
        this._base_event.on(event as any, cb, target);
    }

    public once(event: string | number, cb: () => void, target?: any) {
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
     * manager asset bundle
     */
    private static bundle: AssetManager.Bundle = null;

    /**
     * 系统内置manager的数量
     */
    public static get sysMgrCount() {
        return 5;
    }

    /**
     * 初始化操作
     */
    public static init(onFinish?: Function) {
        if (this.bundle) return onFinish && onFinish();
        // 一定会加载成功
        Core.inst.lib.task.excute((retry) => {
            assetManager.loadBundle(BundleName, (err, bundle) => {
                if (err) return retry(0.1)
                this.bundle = bundle;
                onFinish && onFinish();
            });
        });
    }

    /**
     * 获得初始化资源的数量
     */
    public static getInitAssetNum() {
        if (!this.bundle) throw Error('请先初始化');

        const array = this.bundle.getDirWithPath('/', Prefab) as { uuid: string, path: string, ctor: Function }[];

        let count = 0;

        array.forEach(function (item) {
            if (item.path.endsWith('Manager')) {
                count++;
            }
        });

        return count + this.sysMgrCount;
    }

    /**
     * 获得初始化资源的数量
     */
    public static getInitAssetUrls() {
        if (!this.bundle) throw Error('请先初始化');

        const array = this.bundle.getDirWithPath('/', Prefab) as { uuid: string, path: string, ctor: Function }[];

        const pathArr: string[] = [];

        array.forEach(function (item) {
            if (item.path.endsWith('Manager')) {
                pathArr.push(item.path);
            }
        });

        return pathArr;
    }

    private static inited = false;
    /**
     * 静态方法，初始化manager，该方法必须在场景初始化完毕之后调用
     */
    public static initManagers(progress: (completeAsset: Number, totalAsset: Number) => {}, complete: (totalAsset: Number) => {}) {
        if (!this.bundle) throw Error('请先初始化');
        if (this.inited) return warn('不允许重复初始化');
        this.inited = true;

        const bundle = this.bundle;
        const urls = this.getInitAssetUrls();

        const totalAsset = urls.length + this.sysMgrCount;
        let completeAsset = 0;

        const onProgress = function (next: Function, manager: BaseManager) {
            if (DEBUG) log(`[BaseManager] [log] [beganProgress] %c${manager.managerName}`, 'color:red');
            return function () {
                if (DEBUG) log(`[BaseManager] [log] [endedProgress] %c${manager.managerName}`, 'color:green');
                manager.onInited();
                progress && progress(++completeAsset, totalAsset);
                next();
            };
        };

        // 初始化系统manager
        const aSync1 = Core.inst.lib.task.createASync();
        const sysMgr = [Core.inst.manager.event, Core.inst.manager.timer, Core.inst.manager.loader, Core.inst.manager.sound, Core.inst.manager.ui] as any as BaseManager[];
        sysMgr.forEach(function (manager: BaseManager) {
            aSync1.add(function (next) {
                manager.init(onProgress(next, manager));
            });
        });

        // 加载用户manager
        const aSync2 = Core.inst.lib.task.createASync();
        const userManagerRoot = find(UserManagerRoot);
        urls.forEach(function (url) {
            aSync2.add(function (next, retry) {
                bundle.load(url, Prefab, function (err, prefab: Prefab) {
                    if (err || !prefab) {
                        log(`[BaseManager] [log] [initManager] load ${url} fail, retry...`);
                        retry(0.1);
                    } else {
                        const node: Node = instantiate(prefab);
                        node.active = true;
                        node.parent = userManagerRoot;
                        next();
                    }
                });
            });
        });

        Core.inst.lib.task.createAny()
            .add([
                next => aSync1.start(next),
                next => aSync2.start(next),
            ])
            .add(function (next) {
                Core.inst.emit(Core.EventType.EVENT_SYS_MANAGER_INITED);
                // 初始化用户manager
                const aSync3 = Core.inst.lib.task.createASync();
                userManagerRoot.children.forEach(node => {
                    aSync3.add(function (next) {
                        const manager = node.getComponent(BaseManager);
                        manager.init(onProgress(next, manager));
                    });
                });
                aSync3.start(next);
            })
            .start(function () {
                Core.inst.emit(Core.EventType.EVENT_USER_MANAGER_INITED);
                Core.inst.emit(Core.EventType.EVENT_MANAGER_INITED);
                sysMgr.forEach(function (manager: BaseManager) {
                    manager.onFinished();
                });

                userManagerRoot.children.forEach(function (node) {
                    const manager = node.getComponent(BaseManager);
                    manager.onFinished();
                });
                Core.inst.emit(Core.EventType.EVENT_MANAGER_FINISHED);
                complete && complete(totalAsset);
            });
    }
}