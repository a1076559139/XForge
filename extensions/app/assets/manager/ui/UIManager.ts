import { Asset, AssetManager, Component, error, Event, find, instantiate, isValid, js, Layers, Node, Prefab, Scene, Settings, settings, UITransform, Widget, _decorator } from 'cc';
import { DEBUG } from 'cc/env';
import { IMiniViewName, IViewName } from '../../../../../assets/app-builtin/app-admin/executor';
import BaseManager from '../../base/BaseManager';
import BaseView, { IHideParamOnHide, IShowParamAttr, IShowParamOnHide, IShowParamOnShow, IViewType, ViewType } from '../../base/BaseView';
import Core from '../../Core';
import UIMgrShade from '../../manager/ui/comp/UIMgrShade';
import UIMgrZOrder from '../../manager/ui/comp/UIMgrZOrder';

const { ccclass, property } = _decorator;

const BlockEvents = [
    Node.EventType.TOUCH_START, Node.EventType.TOUCH_MOVE, Node.EventType.TOUCH_END, Node.EventType.TOUCH_CANCEL,
    Node.EventType.MOUSE_DOWN, Node.EventType.MOUSE_MOVE, Node.EventType.MOUSE_UP,
    Node.EventType.MOUSE_ENTER, Node.EventType.MOUSE_LEAVE, Node.EventType.MOUSE_WHEEL
];

enum ErrorCode {
    /**加载失败 */
    LoadError,
    /**beforeShow返回错误 */
    LogicError,
    /**UI无效(UI的isViewValid返回false) */
    InvalidError,
}

interface IShowParams<T, IShow = any, IShowReturn = any, IHideReturn = any> {
    name: T,
    data?: IShow,
    top?: boolean,
    queue?: 'join' | 'jump',
    onShow?: IShowParamOnShow<IShowReturn>,
    onHide?: IShowParamOnHide<IHideReturn>,
    onError?: (result: string, code: ErrorCode) => true | void,
    attr?: IShowParamAttr
}

interface IHideParams<T, IHide = any, IHideReturn = any> {
    name: T,
    data?: IHide,
    onHide?: IHideParamOnHide<IHideReturn>
}

const UIRoot3D = 'Root3D/UserInterface';
const UIRoot2D = 'Root2D/UserInterface';
const ViewTypes = [ViewType.Page, ViewType.Paper, ViewType.Pop, ViewType.Top];

type IPreload = (IViewName | IMiniViewName | Array<IViewName | IMiniViewName>)[];
type IShade = {
    /**等待 默认0秒 */
    delay?: number,
    /**开始透明度 默认60 */
    begin?: number,
    /**结束透明度 默认180 */
    end?: number,
    /**透明变化速度 默认100 */
    speed?: number
};

@ccclass('UIManager')
export default class UIManager<UIName extends string, MiniName extends string> extends BaseManager {
    /**静态设置 */
    static setting: {
        preload?: IPreload,
        defaultUI?: IViewName,
        defaultData?: any,
        shade?: IShade
    } = {};

    /**错误码 */
    static ErrorCode = ErrorCode;

    @property(Prefab)
    private loadingPre: Prefab = null;

    @property(Prefab)
    private shadePre: Prefab = null;

    // 根结点
    private UIRoot2D: Node = null;
    private UIRoot3D: Node = null;

    // 加载和遮罩节点
    private loading: Node = null;
    private shade: Node = null;

    private defaultUI: UIName = null;
    private defaultData: string = '';

    private currPage: BaseView = null;
    private currFocus: BaseView = null;

    // 预制体缓存
    private prefabCache: { [name in string]: Prefab } = {};

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
                        return next => this.installUI(name, next);
                    }));
                } else {
                    task.add(next => this.installUI(preload, next));
                }
            });
            task.start();
        }
    }

    protected onLoad() {
        this.UIRoot2D = find(UIRoot2D);
        this.UIRoot3D = find(UIRoot3D);

        this.initUITouches();
        this.initUITypes();

        this.shade = instantiate(this.shadePre);
        this.loading = instantiate(this.loadingPre);
        this.shade.parent = this.UIRoot2D;
        this.loading.parent = this.UIRoot2D;
        this.shade.active = false;
        this.loading.active = false;
    }

    private initUITouches() {
        for (let i = 0; i < BlockEvents.length; i++) {
            this.UIRoot2D.on(BlockEvents[i], this.stopPropagation, this, true);
        }
    }

    private initUITypes() {
        ViewTypes.forEach((type) => {
            const d3 = new Node(type);
            d3.layer = Layers.Enum.UI_3D;
            d3.addComponent(UIMgrZOrder);
            d3.parent = this.UIRoot3D;

            const d2 = new Node(type);
            d2.layer = Layers.Enum.UI_2D;
            d2.addComponent(UIMgrZOrder);
            d2.parent = this.UIRoot2D;
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
        });
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
     * 安装UI
     */
    private installUI(name: string, complete?: (result: boolean) => any, progress?: (finish: number, total: number, item: AssetManager.RequestItem) => void) {
        if (this.prefabCache[name]) {
            return complete && this.scheduleOnce(() => complete(true));
        }
        const task = Core.inst.lib.task.createAny<[[AssetManager.Bundle, AssetManager.Bundle], Prefab]>()
            .add([
                (next) => {
                    Core.inst.manager.loader.loadBundle({
                        bundle: this.getNativeBundleName(name),
                        onComplete: next
                    });
                },
                (next) => {
                    Core.inst.manager.loader.loadBundle({
                        bundle: this.getResBundleName(name),
                        onComplete: next
                    });
                }
            ])
            .add((next) => {
                if (!task.results[0] || !task.results[0][1]) return next(null);
                Core.inst.manager.loader.load({
                    bundle: this.getNativeBundleName(name),
                    path: this.getUIPath(name),
                    type: Prefab,
                    onProgress: progress,
                    onComplete: next
                });
            })
            .start((results) => {
                const prefab = results[1];
                if (!prefab) {
                    return complete && complete(false);
                }
                // 添加引用计数
                prefab.addRef();
                this.prefabCache[name] = prefab;
                return complete && complete(true);
            });
    }

    /**
     * 卸载UI
     */
    private uninstallUI(name: string) {
        const prefab = this.prefabCache[name];
        if (prefab) {
            // 释放引用计数
            prefab.decRef();
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
            const view = this.getBaseView(target.node) || this.getViewInParents(target.node);
            if (view) {
                Core.inst.manager.loader.load({
                    bundle: this.getResBundleName(view.viewName),
                    path: path,
                    type: type,
                    onComplete: callback
                });
            } else {
                callback && callback(null);
            }
        }
    }

    /**
     * 预加载ui内部资源
     */
    public preloadRes<T extends typeof Asset>(target: Component, path: string, type: T) {
        if (typeof target === 'string') {
            Core.inst.manager.loader.preload({
                bundle: this.getResBundleName(target),
                path: path,
                type: type
            });
        } else {
            const view = this.getBaseView(target.node) || this.getViewInParents(target.node);
            if (view) {
                Core.inst.manager.loader.preload({
                    bundle: this.getResBundleName(view.viewName),
                    path: path,
                    type: type
                });
            } else {
                this.error('preloadRes', target.name, path);
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
            const view = this.getBaseView(target.node) || this.getViewInParents(target.node);
            if (view) {
                Core.inst.manager.loader.loadDir({
                    bundle: this.getResBundleName(view.viewName),
                    path: path,
                    type: type,
                    onComplete: callback
                });
            } else {
                callback && callback([]);
            }
        }
    }

    /**
     * 预加载ui内部资源
     */
    public preloadResDir<T extends typeof Asset>(target: Component, path: string, type: T) {
        if (typeof target === 'string') {
            Core.inst.manager.loader.preloadDir({
                bundle: this.getResBundleName(target),
                path: path,
                type: type
            });
        } else {
            const view = this.getBaseView(target.node) || this.getViewInParents(target.node);
            if (view) {
                Core.inst.manager.loader.preloadDir({
                    bundle: this.getResBundleName(view.viewName),
                    path: path,
                    type: type
                });
            } else {
                this.error('preloadResDir', target.name, path);
            }
        }
    }

    /**
     * 加载UI
     */
    public load(name: UIName | MiniName): void;
    public load(name: UIName | MiniName, complete: (result: any) => any): void;
    public load(name: UIName | MiniName, progress: (finish: number, total: number, item: AssetManager.RequestItem) => void, complete: (result: any) => any): void;
    public load(name: UIName | MiniName, ...args: Function[]): void {
        const progress = (args[1] && args[0]) as (finish: number, total: number, item: AssetManager.RequestItem) => void;
        const complete = (args[1] || args[0]) as (result: any) => any;

        // 验证name是否为真
        if (!name) {
            this.error('load fail');
            return complete && this.scheduleOnce(function () {
                complete(null);
            });
        }

        // 异步加载
        this.installUI(name, (result) => {
            if (!result) return complete && complete(null);
            return complete && complete(this.prefabCache[name]);
        }, progress);
    }

    /**
     * 销毁ui，释放ui的资源
     * 注意：
     * release会直接销毁UI，不管UI是否是show状态
     * @param {*} nameOrNodeOrCom 
     */
    public release(nameOrNodeOrCom: UIName | MiniName | Node | Component | string) {
        let uiName = '';
        if (typeof nameOrNodeOrCom === 'string') {
            uiName = nameOrNodeOrCom;
        } else if (nameOrNodeOrCom != null && typeof nameOrNodeOrCom === 'object') {
            uiName = nameOrNodeOrCom instanceof Node ? nameOrNodeOrCom.name : nameOrNodeOrCom.node.name;
        }

        if (!uiName) {
            this.error(`release ${nameOrNodeOrCom} fail`);
            return;
        }

        // 传入字符串是释放所有
        if (typeof nameOrNodeOrCom === 'string') {
            const nodes = this.getUIInScene(uiName, true);
            nodes.forEach(function (node) {
                if (!node || !isValid(node, true)) return;
                if (DEBUG) {
                    if (this.getBaseView(node).isShowing)
                        error(`${uiName}正处于showing状态，此处将直接destroy`);
                }
                node.parent = null;
                node.destroy();
            });
        }
        // 传入节点或组件是释放单个
        else {
            const node = nameOrNodeOrCom instanceof Node ? nameOrNodeOrCom : nameOrNodeOrCom.node;
            if (node && isValid(node, true)) {
                if (DEBUG) {
                    if (this.getBaseView(node).isShow)
                        error(`${uiName}正处于showing状态，此处将直接destroy`);
                }
                node.parent = null;
                node.destroy();
            }
        }

        // 当全部释放时才清除缓存
        const nodes = this.getUIInScene(uiName, true);
        if (nodes.length === 0 || nodes.every(node => !isValid(node, true))) {
            this.uninstallUI(uiName);
        }
    }

    /**
     * 获取UI原生Bundle名字
     */
    public getNativeBundleName(uiName: string) {
        const oldBundleName = `app-view_${uiName}`;
        const projectBundles = settings.querySettings(Settings.Category.ASSETS, 'projectBundles') as string[];
        if (projectBundles && projectBundles.indexOf(oldBundleName) >= 0) {
            return oldBundleName;
        }
        return BaseManager.stringCaseNegate(uiName);
    }

    /**
     * 获取UI资源Bundle名字
     */
    public getResBundleName(uiName: string) {
        const oldBundleName = `app-view_${uiName}_Res`;
        const projectBundles = settings.querySettings(Settings.Category.ASSETS, 'projectBundles') as string[];
        if (projectBundles && projectBundles.indexOf(oldBundleName) >= 0) {
            return oldBundleName;
        }

        return `${BaseManager.stringCaseNegate(uiName)}-res`;
    }

    /**
     * 获取前缀
     * @param uiName    ui名字
     */
    private getPrefix(uiName: string): ViewType {
        for (let index = 0; index < ViewTypes.length; index++) {
            const name = ViewTypes[index];
            if (uiName.indexOf(name) === 0) {
                return name;
            }
        }
        this.error(`[getPrefix] ${uiName}`);
    }

    // 根据UI名字获取UI路径
    private getUIPath(name: string) {
        return name;
    }

    /**
     * 根据UI名字获取其父节点是谁
     */
    private getUIParent(name: string, is2D: boolean): Node {
        const prefix = this.getPrefix(name);

        for (let index = 0; index < ViewTypes.length; index++) {
            const name = ViewTypes[index];
            if (name === prefix) {
                if (is2D) {
                    return this.UIRoot2D.getChildByName(name);
                } else {
                    return this.UIRoot3D.getChildByName(name);
                }
            }
        }

        this.error(`找不到${name}对应的Parent`);
        return null;
    }

    /**
     * 根据UI名字查询可能的父节点
     */
    private searchUIParents(name: string): Node[] {
        const prefix = this.getPrefix(name);

        for (let index = 0; index < ViewTypes.length; index++) {
            const viewType = ViewTypes[index];
            if (viewType === prefix) {
                return [this.UIRoot2D.getChildByName(viewType), this.UIRoot3D.getChildByName(viewType)];
            }
        }

        this.error(`搜索不到${name}对应的Parents`);
        return [];
    }

    /**
     * 是否是子界面
     */
    private isMiniView(name: string): boolean {
        return name.indexOf(ViewType.Paper) === 0;
    }

    /**
     * 根据UI名字获取场景内的节点
     */
    private getUIInScene(name: string): Node;
    private getUIInScene(name: string, multiple: false): Node;
    private getUIInScene(name: string, multiple: true): Node[];
    private getUIInScene(name: string, multiple = false) {
        const parents = this.searchUIParents(name);

        for (let index = 0; index < parents.length; index++) {
            const parent = parents[index];

            if (multiple) {
                const result = parent.children.filter(node => node.name === name);
                if (result.length) return result.filter(node => isValid(node, true));
            } else {
                const result = parent.children.find(node => node.name === name);
                if (result) return isValid(result, true) ? result : null;
            }
        }

        return multiple ? [] : null;
    }

    /**
     * 根据UI名字获取展示中的节点
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
     * 根据UI名字获取它的脚本类
     */
    private getUIClass(name: string): typeof BaseView {
        return js.getClassByName(name) as (typeof BaseView);
    }

    /**
     * 检查UI是否有效
     * -1 加载失败
     * 0 UI无效
     * 1 UI有效
     */
    private checkUIValid(name: string, data: any, callback: (valid: -1 | 0 | 1) => any) {
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
        let uiRoots = this.UIRoot2D.children;
        for (let index = uiRoots.length - 1; index >= 0; index--) {
            const uiRoot = uiRoots[index];
            if (uiRoot !== this.shade && uiRoot !== this.loading) {
                // 倒序遍历uiRoot
                let children = uiRoot.children;
                for (let i = children.length - 1; i >= 0; i--) {
                    const node = children[i];
                    if (node !== this.shade) {
                        const com = this.getBaseView(node);
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
                            this.shade.parent = uiRoot;
                            this.shade.active = true;
                            this.shade.layer = node.layer;
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
        }

        this.shade.active = false;
        if (!onFocus) {
            isValid(this.currFocus, true) && this.currFocus.constructor.prototype.focus.call(this.currFocus, false);
            this.currFocus = null;
        }
    }

    // 解析prefab
    private parsingPrefab(prefab: Prefab) {
        if (!prefab) return null;
        let node = instantiate(prefab);
        node.active = false;
        if (node.name !== prefab.name) {
            this.warn(`节点名与预制名不一致，已重置为预制名: ${this.getUIPath(prefab.name)}`);
            node.name = prefab.name;
        }
        node.parent = this.getUIParent(prefab.name, node.layer === Layers.Enum.UI_2D);
        node.getComponent(Widget)?.updateAlignment();
        return node;
    }

    private createUILoadingUUID(name: UIName) {
        const uuid = this.addTouchMask();
        if (!this.uiLoadingMap.has(name)) this.uiLoadingMap.set(name, []);
        this.uiLoadingMap.get(name).push(uuid);
        return uuid;
    }

    private checkUILoadingUUID(name: UIName, uuid: string) {
        this.removeTouchMask(uuid);
        if (!this.uiLoadingMap.has(name)) return false;
        const index = this.uiLoadingMap.get(name).indexOf(uuid);
        if (index === -1) return false;
        this.uiLoadingMap.get(name).splice(index, 1);
        return true;
    }

    // 获取UI节点
    private getUI(name: UIName, callback: (node: Node) => any) {
        if (!name) {
            return callback && this.scheduleOnce(() => callback(null));
        }

        // 生成一个UI加载的UUID
        const uiLoadingUuid = this.createUILoadingUUID(name);

        // 判断是否已经存在节点并且是单例模式
        const node = this.getUIInScene(name);
        if (isValid(node, true) && this.getBaseView(node).isSingleton === true) {
            const maskUUID = this.addTouchMask();
            return this.scheduleOnce(() => {
                this.removeTouchMask(maskUUID);
                // 验证本次加载是否有效
                if (this.checkUILoadingUUID(name, uiLoadingUuid) === false) return;
                if (isValid(node, true)) { callback(node); }
                else { this.getUI(name, callback); }
            });
        }

        // 加载prefab
        const showLoadingUuid = this.showLoading();
        this.load(name, (prefab: Prefab) => {
            // 验证本次加载是否有效
            if (this.checkUILoadingUUID(name, uiLoadingUuid) === false) return this.hideLoading(showLoadingUuid);

            // 验证是否是单例(一个单例会有被同时load多次的情况，因为判断一个ui是否是单例，必须要至少实例化一个后才能获取)
            let node = this.getUIInScene(name);
            if (!isValid(node, true) || this.getBaseView(node).isSingleton === false) {
                node = this.parsingPrefab(prefab);
            }

            callback(node);
            this.hideLoading(showLoadingUuid);
        });
    }

    /**
     * 展示默认View
     * @param {*} param0 
     */
    public showDefault(onShow?: (result?: any) => any) {
        if (this.defaultUI) {
            this.show({
                name: this.defaultUI,
                data: this.defaultData,
                onShow
            });
        } else {
            onShow && onShow();
            this.warn('defaultUI 不存在');
        }
    }

    /**
     * 是否展示了(包括加载中和队列中)
     * @param name 
     * @returns 
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
        return true;
    }

    /**
     * 消耗队列
     * @returns 
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
            attr: data.attr
        });
    }

    /**
     * 展示一个UI
     * 此流程一定是异步的
     */
    public show<UI extends BaseView>({ name, data, queue, onShow, onHide, onError, top = true, attr = null }
        // @ts-ignore
        : IShowParams<UIName, Parameters<UI['onShow']>[0], ReturnType<UI['onShow']>, ReturnType<UI['onHide']>>): boolean {

        // 加入队列中
        if (queue) return this.putInShowQueue({ name, data, queue, onShow, onHide, onError, top, attr });

        this.log(`[show] ${name}`);
        const show = () => this.getUI(name, (node) => {
            if (!node) {
                this.error(`[show] ${name} 不存在或加载失败`);
                // 「没有指定onError」或「onError返回true」会自动发起重试
                if (onError && onError(`${name} 不存在或加载失败`, UIManager.ErrorCode.LoadError) !== true) {
                    return;
                }
                this.scheduleOnce(show, 0.1);
                this.showLoading(0.1);
                return;
            }

            top && node.setSiblingIndex(-1);

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
                    } else if (name.indexOf('Page') >= 0) {
                        if (isValid(this.currPage, true) && this.currPage !== com && this.currPage.isShow) {
                            this.currPage.constructor.prototype.hide.call(this.currPage, { name, com });
                        }
                        this.currPage = com;
                    }
                }
            );
        });

        // 判断ui是否有效
        const showLoadingUuid = this.showLoading();
        Core.inst.lib.task.execute((retry) => {
            this.checkUIValid(name, data, (valid) => {
                // 加载失败
                if (valid === -1) {
                    this.error(`[show] ${name} 不存在或加载失败`);
                    // 「没有指定onError」或「onError返回true」会自动发起重试
                    if (onError && onError(`${name} 不存在或加载失败`, UIManager.ErrorCode.LoadError) !== true) {
                        return this.hideLoading(showLoadingUuid);
                    }
                    return retry(0.1);
                }

                // ui无效
                if (valid === 0) {
                    this.uninstallUI(name);
                    onError && onError(`${name} 无效`, UIManager.ErrorCode.InvalidError);
                    this.hideLoading(showLoadingUuid);
                    return;
                }

                show();
                this.hideLoading(showLoadingUuid);
            });
        });
    }

    /**
     * 关闭View
     * 此流程一定是同步的
     */
    public hide<UI extends BaseView>({ name, data, onHide }
        // @ts-ignore
        : IHideParams<UIName, Parameters<UI['onHide']>[0], ReturnType<UI['onHide']>>) {
        const nodes = this.getUIInShowing(name, true);

        if (nodes.length === 0) {
            if (!this.uiLoadingMap.has(name) || this.uiLoadingMap.get(name).length === 0) {
                return this.warn(`hide ${name} 不存在`);
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
    }

    /**
     * 从顶部关闭一个View(不会重复关闭节点)
     * 此流程一定是同步的
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

        this.warn(`pop ${name} 不存在`);
    }

    /**
     * 从底部关闭一个View(不会重复关闭节点)
     * 此流程一定是同步的
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

        this.warn(`shift ${name} 不存在`);
    }

    /**
     * 关闭全部View
     * 1、不关闭展示中的Page(加载中的会停止)
     * 2、不关闭paper
     * 此流程一定是同步的
     */
    public hideAll({ data, exclude }: { data?: any, exclude?: UIName[] } = {}): void {
        // 展示中的
        this.uiShowingMap.forEach((name, com) => {
            if (this.isMiniView(name)) return;
            if (exclude && exclude.indexOf(name) !== -1) return;
            if (com === this.currPage) return;
            com.constructor.prototype.hide.call(com, data);
        });
        // 加载中的
        this.uiLoadingMap.forEach((value, name) => {
            if (this.isMiniView(name)) return;
            if (exclude && exclude.indexOf(name) !== -1) return;
            value.length = 0;
        });
    }

    public showLoading(timeout = 0) {
        this.loading.active = true;
        const uuid = this.createUUID();
        this.showLoadingMap.set(uuid, true);
        if (timeout > 0) this.scheduleOnce(() => {
            this.hideLoading(uuid);
        }, timeout);
        return uuid;
    }

    public hideLoading(uuid: string) {
        this.showLoadingMap.delete(uuid);
        if (this.showLoadingMap.size === 0) {
            this.loading.active = false;
        }
    }

    /**
     * 添加触摸屏蔽
     */
    public addTouchMask(timeout = 0) {
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
        this.touchMaskMap.delete(uuid);
    }

    /**
     * 设置触摸是否启用
     * @param {*} enabled 
     */
    public setTouchEnabled(enabled: boolean) {
        this.log(`setTouchEnabled ${enabled}`);
        this.touchEnabled = !!enabled;
    }

    /**
     * 在2DUI根节点上处理事件
     */
    public onUIRoot2D(...args: Parameters<Node['on']>) {
        Node.prototype.on.apply(this.UIRoot2D, args);
    }

    /**
     * 在2DUI根节点上处理事件
     */
    public onceUIRoot2D(...args: Parameters<Node['once']>) {
        Node.prototype.once.apply(this.UIRoot2D, args);
    }

    /**
     * 在2DUI根节点上处理事件
     */
    public offUIRoot2D(...args: Parameters<Node['off']>) {
        Node.prototype.off.apply(this.UIRoot2D, args);
    }

    /**
     * 在2DUI根节点上处理事件
     */
    public targetOffUIRoot2D(...args: Parameters<Node['targetOff']>) {
        Node.prototype.targetOff.apply(this.UIRoot2D, args);
    }

    /**
     * 立即给2DUI的子节点排序
     */
    public sortUIRoot2D(name: IViewType) {
        this.UIRoot2D
            ?.getChildByName(name)
            ?.getComponent(UIMgrZOrder)
            ?.updateZOrder();
    }
}