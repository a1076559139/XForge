import { Asset, AssetManager, assetManager, Component, error, EventTarget, find, instantiate, js, log, Node, Prefab, warn, Widget, _decorator } from 'cc';
import { DEBUG, DEV, EDITOR } from 'cc/env';
import Core from '../Core';
import Task from '../lib/task/task';

const { ccclass, property } = _decorator;

const dotReWriteFuns = ['emit', 'on', 'once', 'off', 'targetOff'];
const UserManagerRoot = 'Canvas/UserManager';

const uuid = new class UUID {
    private index = 0;

    public create(): string {
        if (this.index++ > 10000000) {
            this.index = 0;
        }
        return `${Date.now()}-${this.index}`;
    }
};

@ccclass('BaseManager')
export default class BaseManager extends Component {
    // 事件管理器
    private _base_event: EventTarget = new EventTarget();

    // asset bundle
    private _base_bundle_name: string = '';

    // manager名字
    private _base_manager_name: string = js.getClassName(this);
    public get managerName() {
        return this._base_manager_name;
    }

    constructor() {
        super();

        if (EDITOR) {
            dotReWriteFuns.forEach((funName) => {
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
        this._base_bundle_name = bundle || '';

        // 无预加载
        if (!preload || !preload.length) {
            return finish && finish();
        }

        // 无bundle名
        if (!bundle) {
            return this.error('配置preload，必须指定bundle');
        }

        // 预加载
        BaseManager.getBundle(bundle, function (result) {
            preload.forEach((path: string) => {
                result.preload(path, function (error, res) {
                    if (DEV) log(`[preload] ${bundle} ${path} ${!!res} ${error}`);
                });
            });
        });

        finish && finish();
    }

    protected createUUID() {
        return uuid.create();
    }

    /**
     * 预加载
     */
    public preload(paths: string | string[], type: typeof Asset, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, items: AssetManager.RequestItem[]) => void): void;
    public preload(paths: string | string[], onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, items: AssetManager.RequestItem[]) => void): void;
    public preload(paths: string | string[], type: typeof Asset, onComplete: (error: Error, items: AssetManager.RequestItem[]) => void): void;
    public preload(paths: string | string[], type: typeof Asset): void;
    public preload(paths: string | string[], onComplete: (error: Error, items: AssetManager.RequestItem[]) => void): void;
    public preload(paths: string | string[]): void;
    public preload(...args: any[]) {
        if (!this._base_bundle_name) return this.error('请先初始化');

        BaseManager.getBundle(this._base_bundle_name, function (bundle) {
            bundle.preload(args[0], args[1], args[2], args[3]);
        });
    }

    /**
     * 预加载
     */
    public preloadDir(dir: string, type: typeof Asset, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, items: AssetManager.RequestItem[]) => void): void;
    public preloadDir(dir: string, onProgress: (finish: number, total: number, item: AssetManager.RequestItem) => void, onComplete: (error: Error, items: AssetManager.RequestItem[]) => void): void;
    public preloadDir(dir: string, type: typeof Asset, onComplete: (error: Error, items: AssetManager.RequestItem[]) => void): void;
    public preloadDir(dir: string, type: typeof Asset): void;
    public preloadDir(dir: string, onComplete: (error: Error, items: AssetManager.RequestItem[]) => void): void;
    public preloadDir(dir: string): void;
    public preloadDir(...args: any[]) {
        if (!this._base_bundle_name) return this.error('请先初始化');

        BaseManager.getBundle(this._base_bundle_name, function (bundle) {
            bundle.preloadDir(args[0], args[1], args[2], args[3]);
        });
    }

    /**
     * 加载
     * @param {*} res 
     * @param {(num:Number,total:Number)=>{}} progress 
     * @param {(success:Boolean)=>{}} complete
     * @example
     * load(resUrl, complete)
     * load(resUrl, progress, complete)
     */
    public load(res: { path: string, type: Function | Asset } | string, progress?: Function, complete?: Function) {
        if (!this._base_bundle_name) return this.error('请先初始化');

        if (!complete) {
            complete = progress;
            progress = undefined;
        }

        if (!res) {
            this.error(`load fail. url is ${JSON.stringify(res)}`);
            return complete && complete(null);
        }

        const args = [];

        if (typeof res === 'string') {
            args.push(res);
        } else {
            args.push(res.path);
            args.push(res.type);
        }

        if (progress) {
            args.push(progress);
        }

        args.push((err, res) => {
            if (err) {
                this.error(`load "${args[0]}" fail`);
                complete && complete(null);
            } else {
                complete && complete(res);
            }
        });

        BaseManager.getBundle(this._base_bundle_name, function (bundle) {
            bundle.load(args[0], args[1], args[2], args[3]);
        });
    }

    /**
     * 销毁操作
     * @param {*} res
     */
    public release(res: string, type?: typeof Asset) {
        const bundle = assetManager.getBundle(this._base_bundle_name);
        bundle && bundle.release(res, type);
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
    private static bundleName: string = 'app-manager';
    private static bundle: AssetManager.Bundle = null;

    /**
     * 系统内置manager的数量
     */
    public static get sysMgrCount() {
        return 4;
    }

    /**
     * 初始化操作
     */
    public static init(onFinish: Function) {
        this.getBundle(this.bundleName, (bundle) => {
            this.bundle = bundle;
            onFinish && onFinish();
        });
    }

    /**
     * 初始化Bundle [一定成功]
     * @param name 
     * @param cb 
     */
    public static getBundle(name: string, cb: (bundle: AssetManager.Bundle) => void) {
        Task.excute((retry) => {
            assetManager.loadBundle(name, (err, bundle) => {
                if (bundle && !err) {
                    cb(bundle);
                } else {
                    setTimeout(retry, 500);
                }
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

    /**
     * 静态方法，初始化manager，该方法必须在场景初始化完毕之后调用
     * @param {(completeAsset:Number, totalAsset:Number)=>{}} progress 
     * @param {(totalAsset:Number)=>{}} complete 
     */
    public static initManagers(progress, complete) {
        if (!this.bundle) throw Error('请先初始化');

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
        const aSync1 = Task.createASync();
        const sysMgr = [Core.inst.manager.event, Core.inst.manager.timer, Core.inst.manager.sound, Core.inst.manager.ui] as any as BaseManager[];
        sysMgr.forEach(function (manager: BaseManager) {
            aSync1.add(function (next) {
                manager.init(onProgress(next, manager));
            });
        });

        // 加载用户manager
        const aSync2 = Task.createASync();
        const userManagerRoot = find(UserManagerRoot);
        urls.forEach(function (url) {
            aSync2.add(function (next, retry) {
                bundle.load(url, Prefab, function (err, prefab: Prefab) {
                    if (err || !prefab) {
                        log(`[BaseManager] [log] [initManager] load ${url} fail, retry...`);
                        setTimeout(retry, 500);
                    } else {
                        const node: Node = instantiate(prefab);
                        node.active = true;
                        node.parent = userManagerRoot;
                        next();
                    }
                });
            });
        });

        Task.createAny()
            .add([
                next => aSync1.start(next),
                next => aSync2.start(next),
            ])
            .add(function (next) {
                Core.inst.emit(Core.EventType.EVENT_SYS_MANAGER_INITED);
                // 初始化用户manager
                const aSync3 = Task.createASync();
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