import { Asset, AssetManager, Camera, Canvas, Component, Event, Layers, Node, Prefab, Scene, SceneAsset, Settings, UITransform, Widget, _decorator, director, find, instantiate, isValid, js, settings } from 'cc';
import { DEBUG, DEV } from 'cc/env';
import { IMiniViewName, IViewName } from '../../../../../assets/app-builtin/app-admin/executor';
import Core from '../../Core';
import BaseManager from '../../base/BaseManager';
import BaseView, { IHideParamOnHide, IShade, IShowParamAttr, IShowParamOnHide, IShowParamOnShow, IViewType, ViewType } from '../../base/BaseView';
import UIMgrLoading from './comp/UIMgrLoading';
import UIMgrShade from './comp/UIMgrShade';
import UIMgrToast from './comp/UIMgrToast';
import UIMgrZOrder from './comp/UIMgrZOrder';

const { ccclass, property } = _decorator;

interface IShowParams<T, IShow = any, IShowReturn = any, IHideReturn = any> {
    /**UI名 */
    name: T,
    /**
     * 数据
     * - 被onShow接收
     */
    data?: IShow,
    /**
     * 是否将UI显示在最上 
     * - 默认true
     */
    top?: boolean,
    /**
     * 队列模式，一个UI关闭后，是否展示下一个UI
     * - join: 排队 
     * - jump: 插队(到首位)
     */
    queue?: 'join' | 'jump',
    /**静默 默认false(不显示加载loading，也不屏蔽触摸) */
    silent?: boolean,
    /**UI触发onShow后 */
    onShow?: IShowParamOnShow<IShowReturn>,
    /**UI触发onHide后 */
    onHide?: IShowParamOnHide<IHideReturn>,
    /**当code的值为ErrorCode.LogicError时，如果返回true，则自动重试 */
    onError?: (result: string, code: ErrorCode) => true | void,
    /**
     * @private
     * @deprecated
     */
    attr?: IShowParamAttr,
}

interface IShowAsyncParams<T, IShow = any, IShowReturn = any> {
    /**UI名 */
    name: T,
    /**
     * 数据
     * - 被onShow接收
     */
    data?: IShow,
    /**
     * 是否将UI显示在最上 
     * - 默认true
     */
    top?: boolean,
    /**
     * 队列模式，一个UI关闭后，是否展示下一个UI
     * - join: 排队 
     * - jump: 插队(到首位)
     */
    queue?: 'join' | 'jump',
    /**静默 默认false(不显示加载loading，也不屏蔽触摸) */
    silent?: boolean,
    /**UI触发onShow后 */
    onShow?: IShowParamOnShow<IShowReturn>,
    /**当code的值为ErrorCode.LogicError时，如果返回true，则自动重试 */
    onError?: (result: string, code: ErrorCode) => true | void,
    /**
     * @private
     * @deprecated
     */
    attr?: IShowParamAttr,
}

interface IHideParams<T, IHide = any, IHideReturn = any> {
    name: T,
    data?: IHide,
    onHide?: IHideParamOnHide<IHideReturn>
}

const UIScene = 'UIRoot';
const Root2DPath = 'Root2D';
const UserInterfacePath = 'Root2D/UserInterface';
const ViewTypes = [ViewType.Page, ViewType.Paper, ViewType.Pop, ViewType.Top];

const BlockEvents = [
    Node.EventType.TOUCH_START, Node.EventType.TOUCH_MOVE, Node.EventType.TOUCH_END, Node.EventType.TOUCH_CANCEL,
    Node.EventType.MOUSE_DOWN, Node.EventType.MOUSE_MOVE, Node.EventType.MOUSE_UP,
    Node.EventType.MOUSE_ENTER, Node.EventType.MOUSE_LEAVE, Node.EventType.MOUSE_WHEEL
];

/**
 * 错误码
 */
enum ErrorCode {
    /**加载失败 */
    LoadError,
    /**beforeShow返回错误 */
    LogicError,
    /**UI无效(UI的isViewValid返回false) */
    InvalidError,
}

/**
 * 界面名字枚举
 */
const ViewName: { [key in IViewName]: key } = new Proxy({} as any, {
    get: function (target, key) {
        if (target[key]) return target[key];
        target[key] = key;
        return key;
    }
});

/**
 * 子界面名字枚举
 */
const MiniViewName: { [key in IMiniViewName]: key } = new Proxy({} as any, {
    get: function (target, key) {
        if (target[key]) return target[key];
        target[key] = key;
        return key;
    }
});

@ccclass('UIManager')
export default class UIManager<UIName extends string, MiniName extends string> extends BaseManager {
    /**静态设置 */
    static setting: {
        preload?: (IViewName | IMiniViewName | Array<IViewName | IMiniViewName>)[],
        defaultUI?: IViewName,
        defaultData?: any,
        shade?: IShade
    } = {};

    /**错误码 */
    static ErrorCode = ErrorCode;

    /**界面名字枚举 */
    static ViewName = ViewName;

    /**子界面名字枚举 */
    static MiniViewName = MiniViewName;

    @property({
        type: Prefab,
        tooltip: '位置: app://manager/ui/prefab/UIMgrLoading'
    })
    private loadingPre: Prefab = null;

    @property({
        type: Prefab,
        tooltip: '位置: app://manager/ui/prefab/UIMgrShade'
    })
    private shadePre: Prefab = null;

    @property({
        type: Prefab,
        tooltip: '位置: app://manager/ui/prefab/UIMgrToast'
    })
    private toastPre: Prefab = null;

    // 2D根节点
    private Root2D: Node = null;
    // UI根节点
    private UserInterface: Node = null;

    // 加载和遮罩节点
    private loading: Node = null;
    private shade: Node = null;
    private toast: Node = null;

    private defaultUI: UIName = null;
    private defaultData: string = '';

    private currScene: string = '';
    private currPage: BaseView = null;
    private currFocus: BaseView = null;

    // 预制体缓存
    private prefabCache: { [name in string]: Prefab } = {};
    private sceneCache: { [name in string]: SceneAsset } = {};

    // 全局触摸有效
    private touchEnabled: boolean = true;

    // 记录触摸屏蔽
    private touchMaskMap = new Map<string, boolean>();
    // 记录展示加载
    private showLoadingMap = new Map<string, boolean>();

    // 记录正在加载中的有效的ui
    private uiLoadingMap: Map<UIName, string[]> = new Map();
    // 记录正在展示中的有效的ui
    private uiShowingMap: Map<BaseView, UIName> = new Map();

    private showQueue: IShowParams<UIName>[] = [];

    /**相机 */
    public get camera() {
        return this.Root2D.getComponent(Canvas).cameraComponent;
    }

    /**画布*/
    public get canvas() {
        return this.Root2D.getComponent(Canvas);
    }

    protected init(finish: Function) {
        const setting = UIManager.setting;

        this.defaultUI = setting.defaultUI as UIName;
        this.defaultData = setting.defaultData;

        super.init(finish);

        // 预加载,符合AnyTask规则
        if (setting.preload?.length) {
            const task = Core.inst.lib.task.createAny();
            setting.preload.forEach((preload) => {
                if (preload instanceof Array) {
                    task.add(preload.map(name => {
                        return next => this.preload(name as any, next);
                    }));
                } else {
                    task.add(next => this.preload(preload as any, next));
                }
            });
            task.start();
        }
    }

    protected onLoad() {
        this.Root2D = find(Root2DPath);

        this.Root2D.getComponentsInChildren(Camera).forEach(camera => {
            // 避免camera.priority<0的情况，否则会造成渲染异常
            if (camera.priority < 0) camera.priority = 0;
            // 避免camera.far<=camera.near的情况，否则会造成渲染异常
            if (camera.far <= camera.near) camera.far = camera.near + 1;
        });

        director.addPersistRootNode(this.Root2D);

        this.UserInterface = find(UserInterfacePath);

        this.initUITypes();

        this.shade = instantiate(this.shadePre);
        this.loading = instantiate(this.loadingPre);
        this.shade.active = false;
        this.loading.active = false;
        this.shade.parent = this.UserInterface;
        this.loading.parent = this.UserInterface;

        // toast是后面加的，需要做容错
        if (this.toastPre) {
            this.toast = instantiate(this.toastPre);
            this.toast.parent = this.UserInterface;
        }
    }

    private initUITypes() {
        ViewTypes.forEach((type) => {
            const d2 = new Node(type);
            d2.layer = Layers.Enum.UI_2D;
            d2.addComponent(UIMgrZOrder);
            d2.parent = this.UserInterface;
            d2.addComponent(UITransform);
            const widget = d2.addComponent(Widget);
            widget.isAlignBottom = true;
            widget.isAlignLeft = true;
            widget.isAlignRight = true;
            widget.isAlignTop = true;
            widget.top = 0;
            widget.left = 0;
            widget.right = 0;
            widget.bottom = 0;
            widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;

            if (DEV) {
                d2.on(Node.EventType.CHILD_ADDED, (child: Node) => {
                    if (!child) return;
                    if (child === this.shade) return;
                    if (this.getBaseView(child)) return;
                    this.warn(`${UserInterfacePath}/${type}下非必要请不要添加非UI节点:`, child?.name);
                }, this);
            }
        });
    }

    private addTouchMaskListener() {
        if (!this.touchEnabled) return;
        if (this.touchMaskMap.size > 0) return;

        for (let i = 0; i < BlockEvents.length; i++) {
            this.UserInterface.on(BlockEvents[i], this.stopPropagation, this, true);
        }
    }

    private removeTouchMaskListener() {
        if (!this.touchEnabled) return;
        if (this.touchMaskMap.size > 0) return;

        for (let i = 0; i < BlockEvents.length; i++) {
            this.UserInterface.off(BlockEvents[i], this.stopPropagation, this, true);
        }
    }

    private stopPropagation(event: Event) {
        if (!this.touchEnabled || this.touchMaskMap.size > 0) {
            event.propagationStopped = true;
            if (event.type !== Node.EventType.MOUSE_MOVE) {
                this.log('屏蔽触摸');
            }
        }
    }

    /**
     * UI是否是子界面
     */
    private isPaper(name: string): boolean {
        return name.indexOf(ViewType.Paper) === 0;
    }

    /**
     * UI是否是页面
     */
    private isPage(name: string): boolean {
        return name.indexOf(ViewType.Page) === 0;
    }

    /**
     * 获取一个节点上的BaseView组件, 获取不到返回null
     */
    private getBaseView(node: Node): BaseView {
        if (!node) return null;
        return node.components.find(component => component instanceof BaseView) as BaseView;
    }

    /**
     * 在所有父节点中找到一个最近的view组件
     * @param target 
     * @returns 
     */
    private getViewInParents(target: Node) {
        let node = target;
        let com: BaseView = null;

        while (node.parent && !(node.parent instanceof Scene)) {
            com = this.getBaseView(node.parent);
            if (!com) {
                node = node.parent;
            } else {
                break;
            }
        }
        return com;
    }

    /**
     * 在子节点中找到一个最近的view组件
     * @param target 
     * @returns 
     */
    private getViewInChildren(target: Node) {
        for (let index = 0; index < target.children.length; index++) {
            const node = target.children[index];
            const com = this.getBaseView(node);
            if (com) return com;
        }
        return null;
    }

    /**
     * 根据UI名字获取它的脚本类
     */
    private getUIClass(name: string): typeof BaseView {
        return js.getClassByName(name) as (typeof BaseView);
    }

    /**
     * 根据UI名字获取UI路径
     * @param name ui名字
     * @returns 
     */
    private getUIPath(name: string) {
        return name;
    }

    /**
     * 获取前缀
     * @param name    ui名字
     */
    private getUIPrefix(name: string): ViewType {
        for (let index = 0; index < ViewTypes.length; index++) {
            const typeName = ViewTypes[index];
            if (name.indexOf(typeName) === 0) {
                return typeName;
            }
        }
        this.error('[getUIPrefix]', `${name}`);
    }

    /**
     * 根据UI名字查询父节点
     * @param name    ui名字
     */
    private getUIParent(name: string): Node {
        if (this.currScene === name) {
            return director.getScene();
        }

        const prefix = this.getUIPrefix(name);
        for (let index = 0; index < ViewTypes.length; index++) {
            const viewType = ViewTypes[index];
            if (viewType === prefix) {
                return this.UserInterface.getChildByName(viewType);
            }
        }

        this.error('[getUIParent]', `找不到${name}对应的Parent`);
        return null;
    }

    /**
     * 根据UI名字获取场景内的节点
     * @param name    ui名字
     */
    private getUIInScene(name: string): Node;
    private getUIInScene(name: string, multiple: false): Node;
    private getUIInScene(name: string, multiple: true): Node[];
    private getUIInScene(name: string, multiple = false) {
        const parent = this.getUIParent(name);

        if (multiple) {
            const result = parent.children.filter(node => node.name === name);
            if (result.length) return result.filter(node => isValid(node, true));
        } else {
            const result = parent.children.find(node => node.name === name);
            if (result) return isValid(result, true) ? result : null;
        }

        return multiple ? [] : null;
    }

    /**
     * 根据UI名字获取展示中的节点
     * @param name    ui名字
     */
    private getUIInShowing(name: string): Node;
    private getUIInShowing(name: string, multiple: false): Node;
    private getUIInShowing(name: string, multiple: true): Node[];
    private getUIInShowing(name: string, multiple = false) {
        if (multiple) {
            const result: Node[] = [];
            this.uiShowingMap.forEach((_name, com) => {
                if (_name === name) result.push(com.node);
            });
            return result;
        } else {
            let result: Node = null;
            this.uiShowingMap.forEach((_name, com) => {
                if (!result && _name === name) result = com.node;
            });
            return result;
        }
    }

    /**
     * 获取UI骨架Bundle名字
     * @deprecated 将会移除，请改为其它方案
     */
    public getNativeBundleName(uiName: UIName | MiniName) {
        // 兼容旧版本
        const oldBundleName = `app-view_${uiName}`;
        const projectBundles = settings.querySettings(Settings.Category.ASSETS, 'projectBundles') as string[];
        if (projectBundles && projectBundles.indexOf(oldBundleName) >= 0) {
            return oldBundleName;
        }

        return BaseManager.stringCaseNegate(uiName);
    }

    /**
     * 获取UI资源Bundle名字
     * @deprecated 将会移除，请改为其它方案
     */
    public getResBundleName(uiName: UIName | MiniName) {
        // 兼容旧版本
        const oldBundleName = `app-view_${uiName}_Res`;
        const projectBundles = settings.querySettings(Settings.Category.ASSETS, 'projectBundles') as string[];
        if (projectBundles && projectBundles.indexOf(oldBundleName) >= 0) {
            return oldBundleName;
        }

        return `${BaseManager.stringCaseNegate(uiName)}-res`;
    }

    /**
     * 初始化Bundle
     */
    private initBundle(name: UIName | MiniName, onFinish: (result: [AssetManager.Bundle, AssetManager.Bundle]) => any) {
        Core.inst.lib.task.createASync<[AssetManager.Bundle, AssetManager.Bundle]>()
            .add((next) => {
                Core.inst.manager.loader.loadBundle({
                    bundle: this.getNativeBundleName(name),
                    onComplete: next
                });
            })
            .add((next) => {
                Core.inst.manager.loader.loadBundle({
                    bundle: this.getResBundleName(name),
                    onComplete: next
                });
            })
            .start(onFinish);
    }

    /**
     * 安装UI
     */
    private installUI(name: UIName | MiniName, complete?: (result: Prefab | SceneAsset) => any, progress?: (finish: number, total: number, item: AssetManager.RequestItem) => void) {
        if (this.sceneCache[name]) {
            complete && setTimeout(() => {
                if (!isValid(this)) return;
                complete(this.sceneCache[name]);
            });
            return;
        } else if (this.prefabCache[name]) {
            complete && setTimeout(() => {
                if (!isValid(this)) return;
                complete(this.prefabCache[name]);
            });
            return;
        }

        const task = Core.inst.lib.task.createSync<[[AssetManager.Bundle, AssetManager.Bundle], Prefab | SceneAsset]>()
            .add(next => {
                this.initBundle(name, next);
            })
            .add((next) => {
                // 失败
                const uiBundles = task.results[0];
                if (!uiBundles || !uiBundles[0] || !uiBundles[1]) return next(null);

                const isScene = uiBundles[0].getSceneInfo(name);
                Core.inst.manager.loader.load({
                    bundle: this.getNativeBundleName(name),
                    path: this.getUIPath(name),
                    type: isScene ? SceneAsset : Prefab,
                    onProgress: progress,
                    onComplete: next
                });
            })
            .start((results) => {
                if (!isValid(this)) return;
                // 验证缓存
                const cache = this.sceneCache[name] || this.prefabCache[name];
                if (cache) {
                    return complete && complete(cache);
                }
                // 验证有效
                const asset = results[1];
                if (!asset) {
                    return complete && complete(null);
                }
                // 添加引用计数
                asset.addRef();
                // 添加缓存
                if (asset instanceof Prefab) {
                    this.prefabCache[name] = asset;
                } else {
                    this.sceneCache[name] = asset;
                }
                this.log('[installUI]', name);
                return complete && complete(asset);
            });
    }

    /**
     * 卸载UI
     */
    private uninstallUI(name: UIName | MiniName) {
        if (this.sceneCache[name]) {
            // 释放引用计数
            this.sceneCache[name].decRef();
            // 删除缓存
            delete this.sceneCache[name];
        } else if (this.prefabCache[name]) {
            // 释放引用计数
            this.prefabCache[name].decRef();
            // 删除缓存
            delete this.prefabCache[name];
        }

        const resBundle = this.getResBundleName(name);
        const naBundle = this.getNativeBundleName(name);
        Core.inst.manager.loader.releaseAll(resBundle);
        Core.inst.manager.loader.releaseAll(naBundle);
        Core.inst.manager.loader.removeBundle(resBundle);
        Core.inst.manager.loader.removeBundle(naBundle);
    }

    /**
     * 加载ui内部资源
     */
    public loadRes<T extends typeof Asset>(target: Component, path: string, type: T, callback?: (item: InstanceType<T>) => any) {
        if (typeof target === 'string') {
            Core.inst.manager.loader.load({
                bundle: this.getResBundleName(target),
                path: path,
                type: type,
                onComplete: callback
            });
        } else {
            const view = this.getBaseView(target.node) || this.getViewInParents(target.node) || this.getViewInChildren(director.getScene());
            if (view) {
                Core.inst.manager.loader.load({
                    bundle: this.getResBundleName(view.viewName as UIName | MiniName),
                    path: path,
                    type: type,
                    onComplete: callback
                });
            } else {
                this.error('[loadRes]', target.name, path);
                callback && callback(null);
            }
        }
    }

    /**
     * 预加载ui内部资源
     */
    public preloadRes<T extends typeof Asset>(target: Component | UIName | MiniName, path: string, type: T) {
        if (typeof target === 'string') {
            Core.inst.manager.loader.preload({
                bundle: this.getResBundleName(target),
                path: path,
                type: type
            });
        } else {
            const view = this.getBaseView(target.node) || this.getViewInParents(target.node) || this.getViewInChildren(director.getScene());
            if (view) {
                Core.inst.manager.loader.preload({
                    bundle: this.getResBundleName(view.viewName as UIName | MiniName),
                    path: path,
                    type: type
                });
            } else {
                this.error('[preloadRes]', target.name, path);
            }
        }
    }

    /**
     * 加载ui内部资源
     */
    public loadResDir<T extends typeof Asset>(target: Component, path: string, type: T, callback?: (items: InstanceType<T>[]) => any) {
        if (typeof target === 'string') {
            Core.inst.manager.loader.loadDir({
                bundle: this.getResBundleName(target),
                path: path,
                type: type,
                onComplete: callback
            });
        } else {
            const view = this.getBaseView(target.node) || this.getViewInParents(target.node) || this.getViewInChildren(director.getScene());
            if (view) {
                Core.inst.manager.loader.loadDir({
                    bundle: this.getResBundleName(view.viewName as UIName | MiniName),
                    path: path,
                    type: type,
                    onComplete: callback
                });
            } else {
                this.error('[loadResDir]', target.name, path);
                callback && callback([]);
            }
        }
    }

    /**
     * 预加载ui内部资源
     */
    public preloadResDir<T extends typeof Asset>(target: Component | UIName | MiniName, path: string, type: T) {
        if (typeof target === 'string') {
            Core.inst.manager.loader.preloadDir({
                bundle: this.getResBundleName(target),
                path: path,
                type: type
            });
        } else {
            const view = this.getBaseView(target.node) || this.getViewInParents(target.node) || this.getViewInChildren(director.getScene());
            if (view) {
                Core.inst.manager.loader.preloadDir({
                    bundle: this.getResBundleName(view.viewName as UIName | MiniName),
                    path: path,
                    type: type
                });
            } else {
                this.error('[preloadResDir]', target.name, path);
            }
        }
    }

    /**
     * 预加载UI
     */
    public preload(name: UIName | MiniName, complete?: (item: AssetManager.RequestItem[]) => any) {
        // 验证name是否为真
        if (!name) {
            this.error('[preload]', 'fail');
            complete && setTimeout(function () {
                if (!isValid(this)) return;
                complete(null);
            });
            return;
        }

        this.initBundle(name, ([naBundle]) => {
            const isScene = naBundle.getSceneInfo(name);
            Core.inst.manager.loader.preload({
                bundle: this.getNativeBundleName(name),
                path: this.getUIPath(name),
                type: isScene ? SceneAsset : Prefab,
                onComplete: complete
            });
        });
    }

    /**
     * 加载UI
     */
    public load(name: UIName | MiniName): void;
    public load(name: UIName | MiniName, complete: (result: Prefab | SceneAsset) => any): void;
    public load(name: UIName | MiniName, progress: (finish: number, total: number, item: AssetManager.RequestItem) => void, complete: (result: Prefab | SceneAsset) => any): void;
    public load(name: UIName | MiniName, ...args: Function[]): void {
        const progress = (args[1] && args[0]) as (finish: number, total: number, item: AssetManager.RequestItem) => void;
        const complete = (args[1] || args[0]) as (result: any) => any;

        // 验证name是否为真
        if (!name) {
            this.error('[load]', 'fail');
            complete && setTimeout(function () {
                if (!isValid(this)) return;
                complete(null);
            });
            return;
        }

        // 异步加载
        this.installUI(name, (result) => {
            if (!result) return complete && complete(null);
            return complete && complete(result);
        }, progress);
    }

    /**
     * 销毁ui，释放ui的资源(hideEvent为destroy模式的UI，无需手动调用)
     * - release会直接销毁UI，不管UI是否是show状态
     */
    public release(nameOrCom: UIName | MiniName | BaseView) {
        let uiName = '';
        if (typeof nameOrCom === 'string') {
            uiName = nameOrCom;
        } else {
            uiName = nameOrCom.viewName;
        }

        if (!uiName) {
            this.error('[release]', `${nameOrCom} fail`);
            return;
        }

        // 传入字符串是释放所有
        if (typeof nameOrCom === 'string') {
            const nodes = this.getUIInScene(uiName, true);
            nodes.forEach((node) => {
                if (!node || !isValid(node, true)) return;
                if (DEBUG) {
                    if (this.getBaseView(node).isShow)
                        this.warn('[release]', `${uiName}正处于show状态, 此处将直接destroy`);
                }
                node.parent = null;
                node.destroy();
            });
        }
        // 传入节点或组件是释放单个
        else {
            const node = nameOrCom.node;
            if (node && isValid(node, true)) {
                if (DEBUG) {
                    if (this.getBaseView(node).isShow)
                        this.warn('[release]', `${uiName}正处于show状态, 此处将直接destroy`);
                }
                node.parent = null;
                node.destroy();
            }
        }

        // 当全部释放时才清除缓存
        const nodes = this.getUIInScene(uiName, true);
        if (nodes.length === 0 || nodes.every(node => !isValid(node, true))) {
            this.uninstallUI(uiName as UIName | MiniName);
            this.log('[release]', uiName);
        }
    }

    /**
     * 检查UI是否有效
     * - -1: 加载失败
     * - 0: UI无效
     * - 1: UI有效
     */
    private checkUIValid(name: UIName | MiniName, data: any, callback: (valid: -1 | 0 | 1) => any) {
        this.installUI(name, (result) => {
            if (!result) return callback(-1);
            const View = this.getUIClass(name);
            if (!View) return callback(0);
            if (!View.isViewValid) return callback(1);
            View.isViewValid((valid: boolean) => {
                callback(valid ? 1 : 0);
            }, data);
        });
    }

    /**
     * 更新阴影的层级及显示
     */
    public refreshShade() {
        // 借助refreshShade实现onFocus、onLostFocus(onFocus不会被每次都触发，只有产生变化时才触发)
        let onFocus = false;
        // 倒序遍历uiRoots
        let uiRoots = this.UserInterface.children;
        for (let index = uiRoots.length - 1; index >= 0; index--) {
            const uiRoot = uiRoots[index];
            if (uiRoot !== this.shade && uiRoot !== this.loading) {
                // 倒序遍历uiRoot
                let children = uiRoot.children;
                for (let i = children.length - 1; i >= 0; i--) {
                    const node = children[i];
                    if (node === this.shade) continue;

                    const com = this.getBaseView(node);
                    if (!com) continue;

                    // 触发onFocus
                    if (!onFocus && com.isCaptureFocus && com.isShow) {
                        onFocus = true;
                        if (this.currFocus !== com) {
                            isValid(this.currFocus, true) && this.currFocus.constructor.prototype.focus.call(this.currFocus, false);
                            this.currFocus = com;
                            this.currFocus.constructor.prototype.focus.call(this.currFocus, true);
                        }
                    }
                    // 添加遮罩
                    if (com.isNeedShade && com.isShow) {
                        const shadeSetting = Object.assign({}, UIManager.setting.shade, com.constructor.prototype.onShade.call(com));
                        this.shade.getComponent(UIMgrShade).init(
                            typeof shadeSetting.delay !== 'number' ? 0 : shadeSetting.delay,
                            typeof shadeSetting.begin !== 'number' ? 60 : shadeSetting.begin,
                            typeof shadeSetting.end !== 'number' ? 180 : shadeSetting.end,
                            typeof shadeSetting.speed !== 'number' ? 100 : shadeSetting.speed
                        );
                        this.shade.layer = node.layer;
                        this.shade.parent = uiRoot;
                        this.shade.active = true;
                        // 以z坐标来代替2.x时代的zIndex
                        this.shade.setPosition(this.shade.position.x, this.shade.position.y, node.position.z);

                        let shadeIndex = this.shade.getSiblingIndex();
                        let nodeIndex = node.getSiblingIndex();
                        if (shadeIndex > nodeIndex) {
                            this.shade.setSiblingIndex(nodeIndex);
                        } else {
                            this.shade.setSiblingIndex(nodeIndex - 1);
                        }
                        return;
                    }
                }
            }
        }

        this.shade.active = false;
        if (!onFocus) {
            isValid(this.currFocus, true) && this.currFocus.constructor.prototype.focus.call(this.currFocus, false);
            this.currFocus = null;
        }
    }

    // 解析prefab
    private parsingPrefab(prefab: Prefab, name: string) {
        if (!prefab) return null;

        const node = instantiate(prefab);

        node.active = false;
        if (node.name !== name) {
            this.warn('[parsingPrefab]', `节点名与UI名不一致, 已重置为UI名: ${this.getUIPath(name)}`);
            node.name = name;
        }

        node.parent = this.getUIParent(name);
        node.getComponent(Widget)?.updateAlignment();
        return node;
    }

    // 解析scene
    private parsingScene(asset: SceneAsset, name: string) {
        if (!asset || !asset.scene) return null;

        if (asset.scene.name !== name) {
            this.warn('[parsingScene]', `场景名与UI名不一致, 已重置为UI名: ${this.getUIPath(name)}`);
            asset.scene.name = name;
        }

        const view = this.getViewInChildren(asset.scene);
        if (!view) {
            this.error('[parsingScene]', `解析场景时未查询到根节点存在BaseView: ${this.getUIPath(name)}`);
            return null;
        }

        view.node.active = false;
        if (view.node.name !== name) {
            this.warn('[parsingScene]', `节点名与UI名不一致, 已重置为UI名: ${this.getUIPath(name)}`);
            view.node.name = name;
        }
        return view.node;
    }

    private addUILoadingUuid(name: UIName) {
        const uuid = this.createUUID();
        if (!this.uiLoadingMap.has(name)) {
            this.uiLoadingMap.set(name, [uuid]);
        } else {
            this.uiLoadingMap.get(name).push(uuid);
        }
        return uuid;
    }

    private removeUILoadingUuid(name: UIName, uuid: string) {
        if (!this.uiLoadingMap.has(name)) return false;
        const index = this.uiLoadingMap.get(name).indexOf(uuid);
        if (index === -1) return false;
        this.uiLoadingMap.get(name).splice(index, 1);
        return true;
    }

    /**
     * 创建UI
     */
    private createUI(name: UIName, silent: boolean, callback: (node: Node, scene?: Scene) => any) {
        // 添加触摸屏蔽
        const maskUUID = silent ? '' : this.addTouchMask();

        if (!name) {
            setTimeout(() => {
                if (!isValid(this)) return;
                // 移除触摸屏蔽
                this.removeTouchMask(maskUUID);
                callback(null);
            });
            return;
        }

        // 生成一个UI加载的UUID
        const uiLoadingUuid = this.addUILoadingUuid(name);

        // 判断是否已经存在节点并且是单例模式
        const node = this.getUIInScene(name);
        if (isValid(node, true) && this.getBaseView(node).isSingleton === true) {
            setTimeout(() => {
                if (!isValid(this)) return;
                // 移除触摸屏蔽
                this.removeTouchMask(maskUUID);
                // 验证本次加载是否有效
                if (this.removeUILoadingUuid(name, uiLoadingUuid) === false) return;
                // 验证节点是否有效
                if (isValid(node, true)) {
                    callback(node);
                } else {
                    this.createUI(name, silent, callback);
                }
            });
            return;
        }

        // 加载prefab
        const loadingUuid = silent ? '' : this.showLoading();
        this.load(name, (asset) => {
            if (!isValid(this)) return;
            // 移除触摸屏蔽
            this.removeTouchMask(maskUUID);

            // 验证本次加载是否有效
            if (this.removeUILoadingUuid(name, uiLoadingUuid) === false) {
                return this.hideLoading(loadingUuid);
            }

            // 是场景
            if (asset instanceof SceneAsset) {
                callback(this.parsingScene(asset, name), asset.scene);
                this.hideLoading(loadingUuid);
                return;
            }

            // 验证是否是单例(一个单例会有被同时load多次的情况，因为判断一个ui是否是单例，必须要至少实例化一个后才能获取)
            const node = this.getUIInScene(name);
            if (!isValid(node, true) || this.getBaseView(node).isSingleton === false) {
                callback(this.parsingPrefab(asset, name));
                this.hideLoading(loadingUuid);
            } else {
                callback(node);
                this.hideLoading(loadingUuid);
            }
        });
    }

    /**
     * 展示默认View
     */
    public showDefault(onShow?: (result?: any) => any) {
        if (this.defaultUI) {
            this.show({
                name: this.defaultUI,
                data: this.defaultData,
                onShow
            });
        } else {
            Core.inst.manager.ui.showToast('请先设置首界面\n在setting.ts中修改', 100);
            onShow && onShow();
            this.warn('defaultUI 不存在');
        }
    }

    /**
     * 是否展示了(包括加载中和队列中)
     */
    public isShow(name: UIName) {
        return !!this.getUIInShowing(name) ||
            this.isInQueue(name) ||
            this.isLoading(name);
    }

    /**
     * 是否在队列中
     */
    public isInQueue(name: UIName) {
        return !!this.showQueue.find((v) => { return v.name == name; });
    }

    /**
     * 是否在加载中
     */
    public isLoading(name: UIName) {
        return this.uiLoadingMap.has(name) && this.uiLoadingMap.get(name).length > 0;
    }

    /**
     * 放入队列
     */
    private putInShowQueue(data: IShowParams<UIName>) {
        if (data.queue === 'join' || this.showQueue.length === 0) {
            this.showQueue.push(data);
        } else {
            this.showQueue.splice(1, 0, data);
        }
        if (this.showQueue.length === 1) {
            this.consumeShowQueue();
        }
    }

    /**
     * 消耗队列
     */
    private consumeShowQueue() {
        if (this.showQueue.length === 0) return;
        const data = this.showQueue[0];
        this.show({
            name: data.name,
            data: data.data,
            onShow: data.onShow,
            onHide: (result: any) => {
                data.onHide && data.onHide(result);
                this.showQueue.shift();
                this.consumeShowQueue();
            },
            onError: data.onError ? (error: string, code: 0 | 1) => {
                const ret = data.onError(error, code);
                this.showQueue.shift();
                this.consumeShowQueue();
                return ret;
            } : undefined,
            top: data.top,
            attr: data.attr,
            silent: data.silent
        });
    }

    private showUI(params: IShowParams<UIName>) {
        const { name, data, onShow, onHide, onError, top = true, attr = null, silent = false } = params;

        this.createUI(name, silent, (node, scene) => {
            if (!node) {
                this.error('[show]', `${name} 不存在或加载失败`);
                // 「没有指定onError」或「onError返回true」会自动发起重试
                if (onError && onError(`${name} 不存在或加载失败`, UIManager.ErrorCode.LoadError) !== true) {
                    return;
                }
                this.scheduleOnce(() => this.showUI(params), 1);
                if (!silent) this.showLoading(1);
                return;
            }

            !scene && top && node.setSiblingIndex(-1);

            const com = this.getBaseView(node);
            this.uiShowingMap.set(com, name);
            com.constructor.prototype.show.call(com, data, attr,
                // onShow
                (result: any) => {
                    onShow && onShow(result);
                },
                // onHide
                (result: any) => {
                    this.uiShowingMap.delete(com);
                    onHide && onHide(result);
                },
                // beforeShow
                (error: string) => {
                    if (error) {
                        this.uiShowingMap.delete(com);
                        onError && onError(error, UIManager.ErrorCode.LogicError);
                    } else if (this.isPage(name)) {
                        if (isValid(this.currPage, true) && this.currPage !== com && this.currPage.isShow) {
                            this.currPage.constructor.prototype.hide.call(this.currPage, { name });
                        }
                        this.currPage = com;
                        if (scene) {
                            if (this.currScene !== name) {
                                this.currScene = name;
                                director.runSceneImmediate(scene, null, () => {
                                    this.log('[scene]', name);
                                });
                            }
                        } else if (this.currScene !== UIScene) {
                            this.currScene = UIScene;
                            const scene = new Scene(UIScene);
                            scene.autoReleaseAssets = true;
                            director.runSceneImmediate(scene, null, () => {
                                this.log('[scene]', UIScene);
                            });
                        }
                    }
                }
            );
        });
    }

    /**
     * 展示一个UI
     * - 此流程一定是异步的
     */
    public show<UI extends BaseView>(params
        // @ts-ignore
        : IShowParams<UIName, Parameters<UI['onShow']>[0], ReturnType<UI['onShow']>, ReturnType<UI['onHide']>>) {
        const { name, data, queue, onError, silent = false } = params;

        // 加入队列中
        if (queue) {
            this.putInShowQueue(params);
            return;
        }

        this.log('[show]', name);

        // 判断ui是否有效
        const showLoadingUuid = silent ? '' : this.showLoading();
        Core.inst.lib.task.execute((retry) => {
            this.checkUIValid(name, data, (valid) => {
                // 加载失败
                if (valid === -1) {
                    this.error('[show]', `${name} 不存在或加载失败`);
                    // 「没有指定onError」或「onError返回true」会自动发起重试
                    if (onError && onError(`${name} 不存在或加载失败`, UIManager.ErrorCode.LoadError) !== true) {
                        return this.hideLoading(showLoadingUuid);
                    }
                    return retry(1);
                }

                // ui无效
                if (valid === 0) {
                    this.warn('[show]', `${name} 无效`);
                    this.uninstallUI(name);
                    onError && onError(`${name} 无效`, UIManager.ErrorCode.InvalidError);
                    this.hideLoading(showLoadingUuid);
                    return;
                }

                this.showUI(params);
                this.hideLoading(showLoadingUuid);
            });
        });
    }

    /**
     * 展示一个UI
     * - 此流程一定是异步的
     */
    public showAsync<UI extends BaseView>(params
        // @ts-ignore
        : IShowAsyncParams<UIName, Parameters<UI['onShow']>[0], ReturnType<UI['onShow']>>): Promise<ReturnType<UI['onHide']>> {
        return new Promise((resolve) => {
            this.show({
                ...params,
                onHide(result) {
                    resolve(result);
                }
            });
        });
    }

    /**
     * 关闭View
     * - 此流程一定是同步的
     */
    public hide<UI extends BaseView>({ name, data, onHide }
        // @ts-ignore
        : IHideParams<UIName, Parameters<UI['onHide']>[0], ReturnType<UI['onHide']>>) {
        const nodes = this.getUIInShowing(name, true);

        if (nodes.length === 0) {
            if (!this.uiLoadingMap.has(name) || this.uiLoadingMap.get(name).length === 0) {
                return this.warn('[hide]', `${name} 不存在`);
            }
        }

        if (this.uiLoadingMap.has(name)) this.uiLoadingMap.get(name).length = 0;

        for (let index = nodes.length - 1; index >= 0; index--) {
            const node = nodes[index];
            const com = this.getBaseView(node);

            if (this.currPage === com) {
                this.currPage = null;
            }

            com.constructor.prototype.hide.call(com, data, onHide);
        }

        this.log('[hide]', name);
    }

    /**
     * 从顶部关闭一个View(不会重复关闭节点)
     * - 此流程一定是同步的
     */
    public pop<UI extends BaseView>({ name, data, onHide }
        // @ts-ignore
        : IHideParams<UIName, Parameters<UI['onHide']>[0], ReturnType<UI['onHide']>>) {
        const nodes = this.getUIInShowing(name, true);

        if (this.uiLoadingMap.has(name) && this.uiLoadingMap.get(name).length) {
            this.uiLoadingMap.get(name).pop();
            return;
        }

        if (nodes.length) {
            const node = nodes.pop();
            const com = this.getBaseView(node);

            if (this.currPage === com) {
                this.currPage = null;
            }

            com.constructor.prototype.hide.call(com, data, onHide);
            return;
        }

        this.warn('[pop]', `${name} 不存在`);
    }

    /**
     * 从底部关闭一个View(不会重复关闭节点)
     * - 此流程一定是同步的
     */
    public shift<UI extends BaseView>({ name, data, onHide }
        // @ts-ignore
        : IHideParams<UIName, Parameters<UI['onHide']>[0], ReturnType<UI['onHide']>>) {
        const nodes = this.getUIInShowing(name, true);

        if (nodes.length) {
            const node = nodes[0];
            const com = this.getBaseView(node);

            if (this.currPage === com) {
                this.currPage = null;
            }

            com.constructor.prototype.hide.call(com, data, onHide);
            return;
        }

        if (this.uiLoadingMap.has(name) && this.uiLoadingMap.get(name).length) {
            this.uiLoadingMap.get(name).shift();
            return;
        }

        this.warn('[shift]', `${name} 不存在`);
    }

    /**
     * 关闭全部View
     * - 不关闭展示中的Page(加载中的会停止)
     * - 不关闭paper
     * - 此流程一定是同步的
     */
    public hideAll({ data, exclude }: { data?: any, exclude?: UIName[] } = {}): void {
        // 展示中的
        this.uiShowingMap.forEach((name, com) => {
            if (this.isPaper(name)) return;
            if (exclude && exclude.indexOf(name) !== -1) return;
            if (com === this.currPage) return;
            com.constructor.prototype.hide.call(com, data);
        });
        // 加载中的
        this.uiLoadingMap.forEach((value, name) => {
            if (this.isPaper(name)) return;
            if (exclude && exclude.indexOf(name) !== -1) return;
            value.length = 0;
        });
    }

    public showLoading(timeout = 0) {
        this.loading.active = true;
        this.loading.getComponentInChildren(UIMgrLoading).init();
        const uuid = this.createUUID();
        this.showLoadingMap.set(uuid, true);
        if (timeout > 0) this.scheduleOnce(() => {
            this.hideLoading(uuid);
        }, timeout);
        return uuid;
    }

    public hideLoading(uuid: string) {
        if (!uuid) return;
        this.showLoadingMap.delete(uuid);
        if (this.showLoadingMap.size === 0) {
            this.loading.getComponentInChildren(UIMgrLoading).clear();
            this.loading.active = false;
        }
    }

    /**
     * 添加触摸屏蔽
     */
    public addTouchMask(timeout = 0) {
        this.addTouchMaskListener();
        const uuid = this.createUUID();
        this.touchMaskMap.set(uuid, true);
        if (timeout > 0) this.scheduleOnce(() => {
            this.removeTouchMask(uuid);
        }, timeout);
        return uuid;
    }

    /**
     * 移除触摸屏蔽
     * @param uuid addTouchMask的返回值
     */
    public removeTouchMask(uuid: string) {
        if (!uuid) return;
        this.touchMaskMap.delete(uuid);
        this.removeTouchMaskListener();
    }

    /**
     * 显示Toast
     * @param message 文本
     * @param timeout 持续时间(秒)，默认2秒
     */
    public showToast(message: string, timeout?: number) {
        if (!this.toast) {
            return this.error('[showToast]', '请确认首场景中「Root2D/Manager/UIManager」的「Toast Pre」属性存在');
        }
        this.toast.getComponent(UIMgrToast).add({
            message, timeout
        });
    }

    /**
     * 清理Toast
     */
    public clearToast() {
        if (!this.toast) return;
        this.toast.getComponent(UIMgrToast).clear();
    }

    /**
     * 设置触摸是否启用
     * @param enabled 是否启用
     */
    public setTouchEnabled(enabled: boolean) {
        if (enabled) {
            this.touchEnabled = true;
            this.removeTouchMaskListener();
        } else {
            this.addTouchMaskListener();
            this.touchEnabled = false;
        }
        this.log('[setTouchEnabled]', this.touchEnabled);
    }

    /**
     * 在2DUI根节点上处理事件
     */
    public onUserInterface(...args: Parameters<Node['on']>) {
        Node.prototype.on.apply(this.UserInterface, args);
    }

    /**
     * 在2DUI根节点上处理事件
     */
    public onceUserInterface(...args: Parameters<Node['once']>) {
        Node.prototype.once.apply(this.UserInterface, args);
    }

    /**
     * 在2DUI根节点上处理事件
     */
    public offUserInterface(...args: Parameters<Node['off']>) {
        Node.prototype.off.apply(this.UserInterface, args);
    }

    /**
     * 在2DUI根节点上处理事件
     */
    public targetOffUserInterface(...args: Parameters<Node['targetOff']>) {
        Node.prototype.targetOff.apply(this.UserInterface, args);
    }

    /**
     * 在2DUI根节点上处理事件
     * @deprecated 
     */
    public onUIRoot2D(...args: Parameters<Node['on']>) {
        Node.prototype.on.apply(this.UserInterface, args);
    }

    /**
     * 在2DUI根节点上处理事件
     * @deprecated 
     */
    public onceUIRoot2D(...args: Parameters<Node['once']>) {
        Node.prototype.once.apply(this.UserInterface, args);
    }

    /**
     * 在2DUI根节点上处理事件
     * @deprecated 
     */
    public offUIRoot2D(...args: Parameters<Node['off']>) {
        Node.prototype.off.apply(this.UserInterface, args);
    }

    /**
     * 在2DUI根节点上处理事件
     * @deprecated 
     */
    public targetOffUIRoot2D(...args: Parameters<Node['targetOff']>) {
        Node.prototype.targetOff.apply(this.UserInterface, args);
    }

    /**
     * 立即给2DUI的子节点排序
     */
    public sortUserInterface(name: IViewType) {
        this.UserInterface
            ?.getChildByName(name)
            ?.getComponent(UIMgrZOrder)
            ?.updateZOrder();
    }
}