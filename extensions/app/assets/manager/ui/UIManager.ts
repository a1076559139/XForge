import { Asset, AssetManager, Canvas, Component, director, error, Event, find, instantiate, isValid, js, Layers, Node, Prefab, Scene, UITransform, Widget, _decorator } from 'cc';
import { DEBUG } from 'cc/env';
import { IViewName, IViewNames } from '../../../../../assets/app-builtin/app-admin/executor';
import BaseManager from '../../base/BaseManager';
import BaseView, { IShowParamAttr, IShowParamOnHide, IShowParamOnShow } from '../../base/BaseView';
import Core from '../../Core';

const { ccclass, property } = _decorator;

const BlockEvents = [
    Node.EventType.TOUCH_START, Node.EventType.TOUCH_MOVE, Node.EventType.TOUCH_END, Node.EventType.TOUCH_CANCEL,
    Node.EventType.MOUSE_DOWN, Node.EventType.MOUSE_MOVE, Node.EventType.MOUSE_UP,
    Node.EventType.MOUSE_ENTER, Node.EventType.MOUSE_LEAVE, Node.EventType.MOUSE_WHEEL
];

interface IShowParams<T, IShow = any, IHide = any> {
    name: T,
    data?: IShow,
    top?: boolean,
    queue?: 'join' | 'jump',
    onShow?: IShowParamOnShow<IShow>,
    onHide?: IShowParamOnHide<IHide>,
    onError?: (result: string, code: 0 | 1) => any,
    onInvalid?: () => any,
    attr?: IShowParamAttr
}

const UIRoot3D = 'Root3D/UserInterface';
const UIRoot2D = 'Root2D/UserInterface';
const UITypes = ['Page', 'Paper', 'Pop', 'Top'];
const MaskTouchEnabledFlg = 1 << 0;
const LoadingTouchEnabledFlg = 1 << 1;

@ccclass('UIManager')
export default class UIManager<UIName extends string, MiniName extends string> extends BaseManager {
    static setting: {
        preload?: IViewNames,
        defaultUI?: IViewName,
        defaultData?: any
    } = {};

    @property(Prefab)
    private loadingPre: Prefab = null;

    @property(Prefab)
    private shadePre: Prefab = null;

    private loading: Node = null;
    private shade: Node = null;
    private UIRoot2D: Node = null;
    private UIRoot3D: Node = null;

    private loadingCount: number = 0;

    private defaultUI: UIName = null;
    private defaultData: string = '';

    private prefabCache: any = {};
    private currPage: BaseView = null;
    private currFocus: BaseView = null;
    private touchEnabled: boolean = true;
    private touchEnabledFlag: number = 0;
    private touchMaskMap = new Map<string, boolean>();

    // 记录正在加载中的有效的ui
    private uiLoadingMap: Map<UIName, string[]> = new Map();//{ [uiName: string]: string[] } = {};
    // 记录正在展示中的有效的ui
    private uiShowingMap: Map<BaseView, UIName> = new Map();

    private showQueue: IShowParams<UIName>[] = [];

    protected init(finish: Function) {
        const setting = UIManager.setting;

        this.defaultUI = setting.defaultUI as UIName;
        this.defaultData = setting.defaultData;

        if (setting && setting.preload) {
            setting.preload.forEach((v, i) => {
                setting.preload[i] = this.getUIPath(v) as any;
            });
        }

        super.init(finish, { preload: setting.preload.map(name => this.getUINativeName(name)) });
    }

    protected onLoad() {
        const scene = director.getScene();
        const canvas = scene.getComponentInChildren(Canvas).node;
        for (let i = 0; i < BlockEvents.length; i++) {
            canvas.on(BlockEvents[i], this.stopPropagation, this, true);
        }

        this.UIRoot3D = find(UIRoot3D);
        this.UIRoot2D = find(UIRoot2D);
        this.initUITypes();

        this.shade = instantiate(this.shadePre);
        this.loading = instantiate(this.loadingPre);
        this.shade.parent = this.UIRoot2D;
        this.loading.parent = this.UIRoot2D;
        this.shade.active = false;
        this.loading.active = false;
    }

    private initUITypes() {
        UITypes.forEach((type) => {
            const d3 = new Node(type);
            d3.layer = Layers.Enum.UI_3D;
            d3.parent = this.UIRoot3D;

            const d2 = new Node(type);
            d2.layer = Layers.Enum.UI_2D;
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
        })
    }

    private stopPropagation(event: Event) {
        if (this.touchEnabledFlag !== 0 || !this.touchEnabled) {
            this.log('触摸屏蔽');
            event.propagationStopped = true;
            // event.stopPropagation();
        }
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
            com = node.parent.getComponent(BaseView);
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
        Core.inst.lib.task.createASync()
            .add((next) => {
                Core.inst.manager.loader.loadBundle({
                    bundle: this.getUIResName(name),
                    onComplete: next,
                })
            })
            .add((next) => {
                Core.inst.manager.loader.load({
                    bundle: this.getUINativeName(name),
                    path: this.getUIPath(name),
                    type: Prefab,
                    onProgress: progress,
                    onComplete: next
                })
            })
            .start((results: [AssetManager.Bundle, Prefab]) => {
                if (!results[0] || !results[1]) return complete && complete(false);
                this.prefabCache[name] = results[1];
                return complete && complete(true);
            })
    }

    /**
     * 卸载UI
     */
    private uninstallUI(name: string) {
        delete this.prefabCache[name];
        const naBundle = this.getUINativeName(name);
        const resBundle = this.getUIResName(name);
        Core.inst.manager.loader.releaseAll(resBundle);
        Core.inst.manager.loader.releaseAll(naBundle);
        Core.inst.manager.loader.removeBundle(resBundle);
        Core.inst.manager.loader.removeBundle(naBundle);
    }

    /**
     * 加载ui内部资源
     */
    public loadRes<T extends Asset>(target: Component, path: string, type: typeof Asset, callback?: (result: T) => any) {
        const view = target.node.getComponent(BaseView) || this.getViewInParents(target.node);
        if (view) {
            Core.inst.manager.loader.load({
                bundle: this.getUIResName(view.viewName),
                path: path,
                type: type,
                onComplete: callback
            })
        } else {
            callback && callback(null);
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
                if (!node || !isValid(node)) return;
                if (DEBUG) {
                    if (node.getComponent(BaseView).isShowing)
                        error(`${uiName}正处于showing状态，此处将直接destroy`);
                }
                node.parent = null;
                node.destroy();
            });
        }
        // 传入节点或组件是释放单个
        else {
            const node = nameOrNodeOrCom instanceof Node ? nameOrNodeOrCom : nameOrNodeOrCom.node;
            if (node && isValid(node)) {
                if (DEBUG) {
                    if (node.getComponent(BaseView).isShowing)
                        error(`${uiName}正处于showing状态，此处将直接destroy`);
                }
                node.parent = null;
                node.destroy();
            }
        }

        // 当全部释放时才清除缓存
        const nodes = this.getUIInScene(uiName, true);
        if (nodes.length === 0 || nodes.every(node => !isValid(node))) {
            this.uninstallUI(uiName);
        }
    }

    public showLoading() {
        ++this.loadingCount;
        this.loading.active = true;
    }

    public hideLoading() {
        if (this.loadingCount > 0 && --this.loadingCount === 0) {
            this.loading.active = false;
        }
    }

    /**
     * 获取UI所在的native名字
     */
    private getUINativeName(uiName: string) {
        return `app-view_${uiName}`;
    }

    /**
     * 获取UI所在的resources名字
     */
    private getUIResName(uiName: string) {
        return `app-view_${uiName}_Res`;
    }

    /**
     * 获取前缀，并首字母转小写
     * @param {String} uiName 驼峰命名法，前缀小写。例如：PopInfo，前缀为pop
     */
    private getPrefix(uiName: string): 'page' | 'pop' | 'top';
    private getPrefix(uiName: string, lowercase: true): 'page' | 'pop' | 'top';
    private getPrefix(uiName: string, lowercase: false): 'Page' | 'Pop' | 'Top';
    private getPrefix(uiName: string, lowercase = true): string {
        for (let index = 0; index < UITypes.length; index++) {
            const name = UITypes[index];
            if (uiName.indexOf(name) === 0) {
                if (lowercase) {
                    return name.toLowerCase();
                } else {
                    return name;
                }
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
        const prefix = this.isMiniView(name) ? 'paper' : this.getPrefix(name);

        for (let index = 0; index < UITypes.length; index++) {
            const name = UITypes[index];
            if (name.toLowerCase() === prefix) {
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
        const prefix = this.isMiniView(name) ? 'paper' : this.getPrefix(name);

        for (let index = 0; index < UITypes.length; index++) {
            const name = UITypes[index];
            if (name.toLowerCase() === prefix) {
                return [this.UIRoot2D.getChildByName(name), this.UIRoot3D.getChildByName(name)]
            }
        }

        this.error(`搜索不到${name}对应的Parents`);
        return [];
    }

    /**
     * 是否是子界面
     */
    private isMiniView(name: string): boolean {
        return name.toLowerCase().indexOf('paper') >= 0;
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
                if (result.length) return result.filter(node => isValid(node));
            } else {
                const result = parent.children.find(node => node.name === name);
                if (result) return isValid(result) ? result : null;
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
    private getUIValid(name: string, callback: (valid: -1 | 0 | 1) => any) {
        this.installUI(name, (result) => {
            if (!result) return callback(-1);
            const View = this.getUIClass(name);
            if (View && View.isViewValid) {
                callback(1);
            } else {
                callback(0);
            }
        })
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
                        const com = node.getComponent(BaseView);
                        // 触发onFocus
                        if (!onFocus && com.isCaptureFocus && com.isShowing) {
                            onFocus = true;
                            if (this.currFocus !== com) {
                                isValid(this.currFocus) && this.currFocus.constructor.prototype.focus.call(this.currFocus, false);
                                this.currFocus = com;
                                this.currFocus.constructor.prototype.focus.call(this.currFocus, true);
                            }
                        }
                        // 添加遮罩
                        if (com.isNeedShade && com.isShowing) {
                            this.shade.parent = uiRoot;
                            this.shade.active = true;
                            this.shade.layer = node.layer;
                            this.shade.getComponent(UITransform).priority = node.getComponent(UITransform)?.priority || 0;

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
            isValid(this.currFocus) && this.currFocus.constructor.prototype.focus.call(this.currFocus, false);
            this.currFocus = null;
        }
    }

    // 解析prefab
    private analyPrefab(prefab: Prefab) {
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
        this.touchEnabledFlag += LoadingTouchEnabledFlg;
        const uuid = this.createUUID();
        if (!this.uiLoadingMap.has(name)) this.uiLoadingMap.set(name, []);
        this.uiLoadingMap.get(name).push(uuid);
        return uuid;
    }

    private checkUILoadingUUID(name: UIName, uuid: string) {
        if (this.touchEnabledFlag >= LoadingTouchEnabledFlg) {
            this.touchEnabledFlag -= LoadingTouchEnabledFlg;
        } else {
            this.error('checkUILoadingUUID', '错误的调用');
        }
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
        const uuid = this.createUILoadingUUID(name);

        // 判断是否已经存在节点并且是单例模式
        const node = this.getUIInScene(name);
        if (isValid(node) && node.getComponent(BaseView).isSingleton === true) {
            const maskUUID = this.addTouchMask();
            return this.scheduleOnce(() => {
                this.removeTouchMask(maskUUID);
                // 验证本次加载是否有效
                if (this.checkUILoadingUUID(name, uuid) === false) return;
                if (isValid(node)) { callback(node); }
                else { this.getUI(name, callback); }
            });
        }

        // 加载prefab
        this.showLoading();
        this.load(name, (prefab: Prefab) => {
            // 验证本次加载是否有效
            if (this.checkUILoadingUUID(name, uuid) === false) return this.hideLoading();

            // 验证是否是单例(一个单例会有被同时load多次的情况，因为判断一个ui是否是单例，必须要至少实例化一个后才能获取)
            let node = this.getUIInScene(name);
            if (!isValid(node) || node.getComponent(BaseView).isSingleton === false) {
                node = this.analyPrefab(prefab);
            }

            callback(node);
            this.hideLoading();
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
     * 是否展示中
     * @param name 
     * @returns 
     */
    public isShowing(name: UIName) {
        return !!this.getUIInShowing(name);
    }

    /**
     * 是否加载中
     * @param name 
     * @returns 
     */
    public isLoading(name: UIName) {
        return this.uiLoadingMap.has(name) && this.uiLoadingMap.get(name).length > 0;
    }

    /**
     * 放入队列
     */
    private putInUIQueue(data: IShowParams<UIName>) {
        if (data.queue === 'join' || this.showQueue.length === 0) {
            if (this.showQueue.find((v) => { return v.name == data.name; }) != undefined) {
                this.warn(`队列中已经存在${data.name}`);
            } else {
                this.showQueue.push(data);
            }
        } else {
            this.showQueue.splice(1, 0, data);
        }
        if (this.showQueue.length === 1) {
            this.consumeUIQueue();
        }
        return true;
    }

    /**
     * 消耗队列
     * @returns 
     */
    private consumeUIQueue() {
        if (this.showQueue.length === 0) return;
        const data = this.showQueue[0];
        this.show({
            name: data.name,
            data: data.data,
            onShow: data.onShow,
            onHide: (result: any) => {
                data.onHide && data.onHide(result);
                this.showQueue.shift();
                this.consumeUIQueue();
            },
            onError: data.onError ? (error: string, code: 0 | 1) => {
                const ret = data.onError(error, code);
                this.showQueue.shift();
                this.consumeUIQueue();
                return ret;
            } : undefined,
            top: data.top,
            attr: data.attr
        });
    }

    /**
     * 展示一个UI
     * @param param0 
     * @returns 
     */
    public show<UI extends BaseView>({ name, data, queue, onShow, onHide, onError, onInvalid, top = true, attr = null }
        // @ts-ignore
        : IShowParams<UIName, Parameters<UI['onShow']>[0], ReturnType<UI['onHide']>>): boolean {

        // 加入队列中
        if (queue) return this.putInUIQueue({ name, data, queue, onShow, onHide, onError, top, attr });

        const show = () => this.getUI(name, (node) => {
            if (!node) {
                this.error(`show ${name} 不存在或加载失败`);
                // 没有指定onError会自动发起重试
                if (onError) return onError(`${name} 不存在或加载失败`, 0);

                this.showLoading();
                return this.scheduleOnce(() => {
                    show();
                    this.hideLoading();
                }, 0.1);
            }

            const com: BaseView = node.getComponent(name as any);

            if (name.indexOf('Page') >= 0 && !this.isMiniView(name)) {
                node.setSiblingIndex(0);
                com.constructor.prototype.show.call(com, data, attr,
                    // @ts-ignore
                    (result: Parameters<UI['onShow']>) => {
                        this.uiShowingMap.set(com, name);
                        onShow && onShow(result);
                    },
                    // @ts-ignore
                    (result: ReturnType<UI['onHide']>) => {
                        this.uiShowingMap.delete(com);
                        onHide && onHide(result);
                    },
                    (error: string) => {
                        if (!error) {
                            if (isValid(this.currPage) && this.currPage !== com && this.currPage.isShowing) {
                                this.currPage.constructor.prototype.hide.call(this.currPage, { name, com });
                            }
                            this.currPage = com;
                        } else {
                            onError && onError(error, 1);
                        }
                    }
                );
            } else {
                top && node.setSiblingIndex(-1);
                com.constructor.prototype.show.call(com, data, attr,
                    (result: any) => {
                        this.uiShowingMap.set(com, name);
                        onShow && onShow(result);
                    },
                    (result: any) => {
                        this.uiShowingMap.delete(com);
                        onHide && onHide(result);
                    },
                    (error: string) => {
                        if (error) {
                            onError && onError(error, 1);
                        }
                    },
                    (name: string, path: string, type: typeof Asset, callback: (result: Asset) => any) => {
                        Core.inst.manager.loader.load({
                            bundle: this.getUIResName(name),
                            path: path,
                            type: type,
                            onComplete: callback
                        })
                    }
                );
            }
        });

        // 判断ui是否有效
        this.showLoading();
        Core.inst.lib.task.excute((retry) => {
            this.getUIValid(name, (valid) => {
                if (valid === -1) return retry(0.1);

                if (valid === 0) {
                    onInvalid && onInvalid();
                    onError && onError(`${name} 无效`, 0);
                } else {
                    show();
                }
                this.hideLoading();
            })
        })
    }

    /**
     * 关闭View
     */
    public hide({ name, data, onHide }: { name: UIName, data?: any, onHide?: (result: any, node: Node) => any }): BaseView | void {
        const nodes = this.getUIInShowing(name, true);

        if (nodes.length === 0) {
            if (!this.uiLoadingMap.has(name) || this.uiLoadingMap.get(name).length === 0) {
                return this.warn(`hide ${name} 不存在`);
            }
        }

        if (this.uiLoadingMap.has(name)) this.uiLoadingMap.get(name).length = 0;

        for (let index = nodes.length - 1; index >= 0; index--) {
            const node = nodes[index];
            const com: BaseView = node.getComponent(name as any);

            if (this.currPage === com) {
                this.currPage = null;
            }

            com.constructor.prototype.hide.call(com, data, onHide);
        }
    }

    /**
     * 从顶部关闭一个View(不会重复关闭节点)
     */
    public pop({ name, data, onHide }: { name: UIName, data?: any, onHide?: (result?: any) => any }): BaseView | void {
        const nodes = this.getUIInShowing(name, true);

        if (this.uiLoadingMap.has(name) && this.uiLoadingMap.get(name).length) {
            this.uiLoadingMap.get(name).pop();
            return;
        }

        if (nodes.length) {
            const node = nodes.pop();
            const com: BaseView = node.getComponent(name as any);

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
     */
    public shift({ name, data, onHide }: { name: UIName, data?: any, onHide?: (result?: any) => any }): BaseView | void {
        const nodes = this.getUIInShowing(name, true);

        if (nodes.length) {
            const node = nodes[0];
            const com: BaseView = node.getComponent(name as any);

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

    /**
     * 添加触摸屏蔽
     */
    public addTouchMask() {
        this.touchEnabledFlag |= MaskTouchEnabledFlg;
        const uuid = this.createUUID();
        this.touchMaskMap.set(uuid, true);
        return uuid;
    }

    /**
     * 移除触摸屏蔽
     * @param uuid addTouchMask的返回值
     */
    public removeTouchMask(uuid: string) {
        this.touchMaskMap.delete(uuid);
        if (this.touchMaskMap.size === 0) {
            this.touchEnabledFlag ^= MaskTouchEnabledFlg;
        }
    }

    /**
     * 设置触摸是否启用
     * @param {*} enabled 
     */
    public setTouchEnabled(enabled: boolean) {
        this.touchEnabled = !!enabled;
    }

    /**
     * 在2DUI根节点上处理事件
     */
    onUIRoot2D(...args: Parameters<Node['on']>) {
        Node.prototype.on.apply(this.UIRoot2D, args);
    }

    /**
     * 在2DUI根节点上处理事件
     */
    onceUIRoot2D(...args: Parameters<Node['once']>) {
        Node.prototype.once.apply(this.UIRoot2D, args);
    }

    /**
     * 在2DUI根节点上处理事件
     */
    offUIRoot2D(...args: Parameters<Node['off']>) {
        Node.prototype.off.apply(this.UIRoot2D, args);
    }

    /**
     * 在2DUI根节点上处理事件
     */
    targetOffUIRoot2D(...args: Parameters<Node['targetOff']>) {
        Node.prototype.targetOff.apply(this.UIRoot2D, args);
    }
}