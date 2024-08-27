import { Asset, Component, Enum, EventTouch, Font, Label, Node, Scene, Sprite, SpriteFrame, UITransform, Widget, _decorator, director, error, isValid, js, log, sp } from 'cc';
import { EDITOR } from 'cc/env';
import { IMiniViewName, IMiniViewNames, IViewName } from '../../../../assets/app-builtin/app-admin/executor';
import Core from '../Core';
import { IBaseControl } from './BaseControl';
import { IBaseController } from './BaseController';

const { ccclass, property } = _decorator;

const BlockEvents = [
    Node.EventType.TOUCH_START, Node.EventType.TOUCH_MOVE, Node.EventType.TOUCH_END, Node.EventType.TOUCH_CANCEL,
    Node.EventType.MOUSE_DOWN, Node.EventType.MOUSE_MOVE, Node.EventType.MOUSE_UP,
    Node.EventType.MOUSE_ENTER, Node.EventType.MOUSE_LEAVE, Node.EventType.MOUSE_WHEEL
];

const HideEvent = Enum({
    destroy: 1,
    active: 2
});

export type IShade = {
    /**等待 默认0秒 */
    delay?: number,
    /**开始透明度 默认60 */
    begin?: number,
    /**结束透明度 默认180 */
    end?: number,
    /**透明变化速度 默认100 */
    speed?: number
};

export interface IShowParamAttr {
    zIndex?: number,
    siblingIndex?: number,
}

export interface IShowParamOnShow<T = any> {
    (result: T): any
}

export interface IShowParamOnHide<T = any> {
    (result: T): any
}

export interface IShowParamBeforeShow {
    (error: string): any
}

export interface IShowParamInnerLoad {
    (name: string, path: string, type: { prototype: Asset }, callback: (result: Asset) => any): void
}

export interface IHideParamOnHide<T = any> {
    (result: T): any
}

export type IViewType = 'Page' | 'Paper' | 'Pop' | 'Top';

export enum ViewType {
    Page = 'Page',
    Paper = 'Paper',
    PaperAll = 'PaperAll',
    Pop = 'Pop',
    Top = 'Top'
}

interface IMiniOnShow {
    (name: string, data?: any): any
}
interface IMiniOnHide {
    (name: string, data?: any): any
}
interface IMiniOnFinish {
    (): any
}
type IPick<T> = {
    -readonly [P in keyof T]: T[P] extends Function
    ? T[P]
    : (T[P] extends Object
        ? IPick<T[P]>
        : T[P]);
};
interface IBaseViewController<C, T extends { [key in string]: any }> {
    new(): BaseView & {
        readonly controller: IPick<C> & Readonly<{
            emit<K extends keyof T>(key: K, ...args: Parameters<T[K]>): void;
            call<K extends keyof T & keyof T>(key: K, ...args: Parameters<T[K]>): ReturnType<T[K]>;
            on<K extends keyof T>(key: K, callback: (...args: Parameters<T[K]>) => ReturnType<T[K]>, target?: any): void;
            once<K extends keyof T>(key: K, callback: (...args: Parameters<T[K]>) => ReturnType<T[K]>, target?: any): void;
            off(key: keyof T, callback: Function, target?: any): void;
            targetOff(target: any): void;
        }>
    }
}

enum ViewState {
    BeforeShow,
    Showing,
    Showed,
    BeforeHide,
    Hiding,
    Hid,
}

const Group = { id: 'BaseView', name: 'Settings', displayOrder: -Infinity, style: 'section' };

@ccclass('BaseView')
export default class BaseView extends Component {
    /**
     * @deprecated 废弃，请使用Controller代替Control
     */
    static BindControl<C, E, T extends { [key in keyof E]?: any }>(control: IBaseControl<C, E, T>) {
        return class BindControl extends BaseView {
            protected get control(): Pick<C, keyof C> & Readonly<{
                call<K extends keyof E>(key: E[K], ...args: Parameters<T[K]>): ReturnType<T[K]>;
                emit<K extends keyof E>(key: E[K], ...args: Parameters<T[K]>): void;
                on<K extends keyof E>(key: E[K], callback: (...args: Parameters<T[K]>) => ReturnType<T[K]>, target?: any): void;
                once<K extends keyof E>(key: E[K], callback: (...args: Parameters<T[K]>) => ReturnType<T[K]>, target?: any): void;
                off(key: E[keyof E], callback: Function, target?: any): void;
                targetOff(target: any): void;
            }> {
                return control ? control.inst as any : null;
            }
        };
    }

    static BindController<C, T extends { [key in string]: any }>(controller: IBaseController<C, T>) {
        return class BindController extends BaseView {
            protected get controller() {
                return controller ? controller.inst as any : null;
            }
        } as any as IBaseViewController<C, T>;
    }

    /**是否有效/是否可以被展示 */
    public static isViewValid(next: (valid: boolean) => void, data: any) {
        data;
        next && next(true);
    }

    // 是否被调用过
    private _isOnCreateCalled = false;
    // view状态
    private _base_view_state = ViewState.Hid;
    // 当前view的名字
    private _base_view_name: IViewName | IMiniViewName = js.getClassName(this) as any;
    // 触摸是否有效
    private _base_touch_enable = true;
    // show/hide等待列表
    private _base_show_hide_delays: Function[] = [];
    // 子界面融合相关
    private _base_mini_show: Set<IMiniViewName> = new Set();

    protected isPage() {
        return this._base_view_name?.indexOf(ViewType.Page) === 0;
    }

    protected isPaper() {
        return this._base_view_name?.indexOf(ViewType.Paper) === 0;
    }

    protected isPaperAll() {
        return this._base_view_name?.indexOf(ViewType.PaperAll) === 0;
    }

    protected isPop() {
        return this._base_view_name?.indexOf(ViewType.Pop) === 0;
    }

    protected isTop() {
        return this._base_view_name?.indexOf(ViewType.Top) === 0;
    }

    protected is2D() {
        return !this.is3D();
    }

    protected is3D() {
        if (this.node.parent instanceof Scene) {
            return this.node.parent.name === this.viewName;
        }
        const scene = director.getScene();
        return scene.name === this.viewName;
    }

    @property
    private _hideEvent = HideEvent.destroy;
    @property({
        group: Group,
        type: HideEvent,
        tooltip: '何种模式隐藏节点\n1、destroy: 销毁UI并释放对应的所有资源\n2、active: 缓存UI并加速下次的打开速度',
    })
    public get hideEvent() {
        if (this.is3D()) return HideEvent.destroy;
        return this._hideEvent;
    }
    public set hideEvent(value) {
        if (this.is3D() && value !== HideEvent.destroy) {
            this.log('3D模式下只能选择destroy模式');
            return;
        }
        this._hideEvent = value;
    }

    @property
    private _singleton = true;
    private static _singleton = true;
    @property({
        group: Group,
        tooltip: '是否是单例模式\n1、单例模式: UI只会被创建一次(onShow会被重复触发)\n2、非单例模式: UI会被重复创建',
    })
    protected get singleton(): boolean {
        if (this.isPage()) return true;
        if (this.isPaperAll()) return false;
        if (this.isPaper()) return true;
        return this._singleton && (<typeof BaseView>this.constructor)._singleton;
    }
    protected set singleton(value) {
        if (value) {
            if (this.isPaperAll()) {
                this.log('PaperAll只能是非单例模式');
                return;
            }
        } else {
            if (this.isPage()) {
                this.log('Page只能是单例模式');
                return;
            }
            if (this.isPaper()) {
                this.log('Paper只能是单例模式');
                return;
            }
        }
        this._singleton = (<typeof BaseView>this.constructor)._singleton = !!value;
    }

    @property
    private _captureFocus = true;
    @property({
        group: Group,
        tooltip: '是否捕获焦点<响应onLostFocus和onFocus>\n1、当一个捕获焦点的UI处于最上层并展示时\n下层的UI永远不会响应focus事件',
        visible(this: BaseView) {
            if (this.is3D()) return false;
            return true;
        }
    })
    protected get captureFocus() {
        if (this.is3D()) return false;
        return this._captureFocus;
    }
    protected set captureFocus(value) {
        if (value && this.is3D()) {
            this.log('只有2D模式下才可以捕获焦点');
            return;
        }
        this._captureFocus = value;
    }

    @property
    private _shade = true;
    @property({
        group: Group,
        tooltip: '是否需要底层遮罩',
        visible(this: BaseView) {
            if (this.is3D()) return false;
            if (this.isPage()) return false;
            return true;
        }
    })
    protected get shade() {
        if (this.is3D()) return false;
        if (this.isPage()) return false;
        return this._shade;
    }
    protected set shade(value) {
        if (value) {
            if (this.is3D()) {
                this.log('只有2D模式下才可以设置底层遮罩');
                return;
            }
            if (this.isPage()) {
                this.log('Page不可以设置底层遮罩');
                return;
            }
        }

        if (!EDITOR && this._shade !== value) {
            this._shade = value;
            Core.inst?.manager?.ui?.refreshShade();
        } else {
            this._shade = value;
        }
    }

    @property
    private _blockInput = true;
    @property({
        group: Group,
        tooltip: '是否禁止点击事件向下层传递',
        visible(this: BaseView) {
            if (this.is3D()) return false;
            return true;
        }
    })
    protected get blockInput() {
        if (this.is3D()) return false;
        return this._blockInput;
    }
    protected set blockInput(value) {
        if (value && this.is3D()) {
            this.log('只有2D模式下才可以设置阻断点击事件');
            return;
        }
        this._blockInput = value;
    }

    /**
     * 子界面(只能用于Page)
     */
    protected miniViews: IMiniViewNames = [];

    /**
     * 当前view名字
     */
    public get viewName() {
        return this._base_view_name;
    }

    /**
     * 基础名字, 如PageHome => Home
     */
    public get baseName() {
        return this._base_view_name.slice(this.typeName.length);
    }

    /**
     * 类型名字, 如PageHome => Page
     */
    public get typeName() {
        if (this._base_view_name.indexOf(ViewType.Paper) === 0) return ViewType.Paper;
        if (this._base_view_name.indexOf(ViewType.Pop) === 0) return ViewType.Pop;
        if (this._base_view_name.indexOf(ViewType.Top) === 0) return ViewType.Top;
        return ViewType.Page;
    }

    /**
     * 是否是单例模式
     */
    public get isSingleton(): boolean {
        return this.singleton;
    }

    /**
     * 是否捕获焦点
     */
    public get isCaptureFocus(): boolean {
        return this.captureFocus;
    }

    /**
     * 是否需要遮罩
     */
    public get isNeedShade(): boolean {
        return this.shade;
    }

    /**
     * 是否展示了(不为Hid状态)
     */
    public get isShow(): boolean {
        return this._base_view_state != ViewState.Hid;
    }

    /**
     * 是否show了某个子界面
     */
    protected isMiniViewShow(name: IMiniViewName) {
        return this._base_mini_show.has(name);
    }

    // 用来初始化组件或节点的一些属性，当该组件被第一次添加到节点上或用户点击了它的 Reset 菜单时调用。这个回调只会在编辑器下调用。
    resetInEditor(): any {
        if (EDITOR) {
            const is3D = this.is3D();
            if (this.viewName.indexOf(ViewType.Page) >= 0) {
                this.shade = false;
                this.blockInput = is3D ? false : true;
                this.captureFocus = is3D ? false : true;
            } else if (this.viewName.indexOf(ViewType.Paper) >= 0) {
                this.shade = false;
                this.captureFocus = false;
                this.blockInput = false;
            }

            if (is3D) return;
            this.node.getComponent(UITransform) || this.node.addComponent(UITransform);

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
    }

    /**
     * 设置是否可点击
     */
    protected setTouchEnabled(enabled: boolean = true): any {
        this._base_touch_enable = !!enabled;
    }

    private blockPropagation(event: EventTouch) {
        if (this.blockInput) {
            event.propagationStopped = true;
            if (event.type === Node.EventType.TOUCH_START) {
                this.log('阻断触摸向下层传递');
            }
        }
    }

    private stopPropagation(event: EventTouch) {
        if (!this._base_touch_enable) {
            event.propagationStopped = true;
            event.propagationImmediateStopped = true;
            if (event.type === Node.EventType.TOUCH_START) {
                this.log('屏蔽触摸');
            }
        }
    }

    private onCreate(): any {
        if (this.is3D()) return;
        const uiTransform = this.getComponent(UITransform);
        if (uiTransform) uiTransform.hitTest = (...args: any[]): boolean => {
            if (this.blockInput) {
                return UITransform.prototype.hitTest.apply(uiTransform, args);
            }
            return false;
        };

        for (let i = 0; i < BlockEvents.length; i++) {
            this.node.on(BlockEvents[i], this.blockPropagation, this);
            this.node.on(BlockEvents[i], this.stopPropagation, this, true);
        }
    }

    /**
     * 关闭所有子界面
     */
    protected hideAllMiniViews(data?: any) {
        this._base_mini_show.forEach((name) => {
            Core.inst.manager.ui.shift({ name, data });
        });
        this._base_mini_show.clear();
    }

    /**
     * 关闭子界面
     */
    protected hideMiniViews({ data, views }: { data?: any, views: IMiniViewNames }) {
        if (this.miniViews.length === 0) return;
        if (views.length === 0) return;

        views.forEach(name => {
            if (this.miniViews.indexOf(name) === -1) {
                this.warn('[hideMiniViews]', `${name}不在miniViews中, 已跳过`);
                return;
            }

            if (!this._base_mini_show.has(name)) return;

            Core.inst.manager.ui.hide({ name, data });
        });
    }

    /**
     * 展示子界面
     */
    protected showMiniViews({ data, views, onShow, onHide, onFinish }: { data?: any, views: Array<IMiniViewName | IMiniViewNames>, onShow?: IMiniOnShow, onHide?: IMiniOnHide, onFinish?: IMiniOnFinish }) {
        if (views.length === 0) return false;
        if (this.typeName !== ViewType.Page) {
            this.warn('[showMiniViews]', '仅支持Page类型');
            return false;
        }

        const task = Core.inst.lib.task.createSync();

        for (let index = 0; index < views.length; index++) {
            const names = views[index];
            if (names instanceof Array) {
                task.add(next => {
                    this.createMixMiniViewsTask(names, data, onShow, onHide).start(next);
                });
            } else {
                task.add(next => {
                    this.createMixMiniViewsTask([names], data, onShow, onHide).start(next);
                });
            }
        }

        task.start(onFinish && function () {
            onFinish();
        });

        return true;
    }

    /**
     * 创建自定义加载任务
     */
    private createMixMiniViewsTask(views: IMiniViewNames = [], data?: any, onShow?: IMiniOnShow, onHide?: IMiniOnHide) {
        const task = Core.inst.lib.task.createSync();

        if (this.typeName !== ViewType.Page) {
            this.warn('[showMiniViews]', '仅支持Page类型');
            return task;
        }

        views = views.filter(name => {
            if (!name) {
                this.warn('[showMiniViews]', 'name不能为空');
                return false;
            }
            if (this._base_mini_show.has(name)) {
                this.warn('[showMiniViews]', `重复融合${name}, 已跳过`);
                return false;
            }
            if (this.miniViews.indexOf(name) === -1) {
                this.warn('[showMiniViews]', `${name}不在miniViews中, 已跳过`);
                return false;
            }
            if (name.indexOf(this.baseName) !== ViewType.Paper.length && name.indexOf(ViewType.PaperAll) !== 0) {
                this.warn('[showMiniViews]', `${name}不属于当前Page, 已跳过`);
                return false;
            }

            this._base_mini_show.add(name);
            return true;
        });

        if (views.length === 0) return task;

        // 先load全部
        task.add((next) => {
            const aSync = Core.inst.lib.task.createASync();
            views.forEach(name => {
                aSync.add((next, retry) => {
                    this.log('[mixin-load]', name);
                    Core.inst.manager.ui.load(name as any, result => {
                        result ? next() : this.scheduleOnce(retry, 0.1);
                    });
                });
            });
            aSync.start(next);
        });

        // 再show全部
        task.add((next) => {
            const aSync = Core.inst.lib.task.createASync();
            views.forEach(name => {
                aSync.add((next) => {
                    this.log('[mixin-show]', name);
                    if (!this._base_mini_show.has(name)) return next();

                    Core.inst.manager.ui.show({
                        name, data,
                        silent: true,
                        attr: { zIndex: this.miniViews.indexOf(name) },
                        onShow: (result) => {
                            if (onShow) onShow(name, result);
                            next();
                        },
                        onHide: (result) => {
                            this._base_mini_show.delete(name);
                            if (onHide) onHide(name, result);
                        },
                        onError: (result, code) => {
                            if (code === Core.inst.Manager.UI.ErrorCode.LoadError) return true;
                            this._base_mini_show.delete(name);
                            this.warn('[mixin-show]', name, result, '已跳过');
                            next();
                        },
                    });
                });
            });
            aSync.start(next);
        });

        return task;
    }

    /**
     * 设置节点属性
     */
    private setNodeAttr(attr: IShowParamAttr) {
        if (!attr) return;
        if (typeof attr.zIndex === 'number') {
            // 以z坐标来代替2.x时代的zIndex
            this.node.position.set(this.node.position.x, this.node.position.y, attr.zIndex);
        }

        if (typeof attr.siblingIndex === 'number') {
            this.node.setSiblingIndex(attr.siblingIndex);
        }
    }

    private show(data?: any, attr?: IShowParamAttr, onShow?: IShowParamOnShow, onHide?: IShowParamOnHide, beforeShow?: IShowParamBeforeShow) {
        // 当前show操作需要等待其它流程
        if (this._base_view_state !== ViewState.Showed &&
            this._base_view_state !== ViewState.Hid) {
            this._base_show_hide_delays.push(
                this.show.bind(this, data, attr, onShow, onHide, beforeShow)
            );
            return;
        }

        // show流程
        const changeState = this._base_view_state === ViewState.Hid;
        if (changeState) this._base_view_state = ViewState.BeforeShow;
        const next = (error: string) => {
            beforeShow && beforeShow(error);
            if (!error) {
                // 设置展示中
                if (changeState) this._base_view_state = ViewState.Showing;
                onHide && this.node.once('onHide', onHide);

                // 触发onCreate
                if (this._isOnCreateCalled === false) {
                    this._isOnCreateCalled = true;
                    this.onCreate();
                }

                // 设置属性
                this.setNodeAttr(attr);

                // 触发onLoad、onEnable
                if (this.node.active !== true) { this.node.active = true; }

                this.log('onShow');
                let result = null;
                try {
                    result = this.onShow(data);
                } catch (err) {
                    this.onError();
                    console.error(err);
                }

                // 设置遮罩，触发focus逻辑
                Core.inst.manager.ui.refreshShade();

                try {
                    onShow && onShow(result);
                    this.node.emit('onShow', result);
                    Core.inst.manager.ui.emit(this._base_view_name, { event: 'onShow', result: result });
                    Core.inst.manager.ui.emit('onShow', { name: this._base_view_name, result: result });
                } catch (err) {
                    console.error(err);
                }

                if (changeState) this._base_view_state = ViewState.Showed;
            } else {
                if (changeState) this._base_view_state = ViewState.Hid;
            }

            if (this._base_show_hide_delays.length > 0) {
                this._base_show_hide_delays.shift()();
            }
        };

        this.log('beforeShow');
        let isNextCalled = false;
        this.beforeShow((error) => {
            if (isNextCalled) return this.error('beforeShow', 'next被重复调用');
            isNextCalled = true;
            next(error || null);
        }, data);
    }

    protected hide(
        //@ts-ignore
        data?: Parameters<this['onHide']>[0],
        onHide?: IHideParamOnHide) {

        // 当前hide操作需要等待其它流程
        if (this._base_view_state !== ViewState.Hid &&
            this._base_view_state !== ViewState.Showed) {
            this._base_show_hide_delays.push(
                this.hide.bind(this, data, onHide)
            );
            return;
        }

        // hide流程
        const changeState = this._base_view_state === ViewState.Showed;
        if (changeState) this._base_view_state = ViewState.BeforeHide;
        this.log('beforeHide');
        const error = this.beforeHide(data);
        if (!error) {
            this.log('onHide');
            if (changeState) this._base_view_state = ViewState.Hiding;
            this.hideAllMiniViews(data);

            let result = null;
            try {
                result = this.onHide(data);
            } catch (error) {
                console.error(error);
            }

            try {
                onHide && onHide(result);
                this.node.emit('onHide', result);
                Core.inst.manager.ui.emit(this._base_view_name, { event: 'onHide', result: result });
                Core.inst.manager.ui.emit('onHide', { name: this._base_view_name, result: result });
            } catch (error) {
                console.error(error);
            }

            if (changeState) this._base_view_state = ViewState.Hid;

            if (this.hideEvent === HideEvent.active) { this.node.active = false; }
            else if (this.hideEvent === HideEvent.destroy) { Core.inst.manager.ui.release(this); }
            Core.inst.manager.ui.refreshShade();
        } else {
            if (changeState) this._base_view_state = ViewState.Showed;
        }

        if (this._base_show_hide_delays.length > 0) {
            this._base_show_hide_delays.shift()();
        }
    }

    private focus(boo: boolean): any {
        let result = null;
        let event = '';
        if (boo) {
            result = this.onFocus();
            event = 'onFocus';
        } else {
            result = this.onLostFocus();
            event = 'onLostFocus';
        }

        this.node.emit(event, result);
        Core.inst.manager.ui.emit(this._base_view_name, { event: event, result: result });
        Core.inst.manager.ui.emit(event, { name: this._base_view_name, result: result });
    }

    /**
     * 加载UI目录下resources里面的资源
     * @param path 相对于resources的路径
     * @param callback 回调
     * this.loadRes('Bag', Prefab, function(asset){})
     */
    protected loadRes<T extends typeof Asset>(path: string, type: T, callback?: (result: InstanceType<T>) => any) {
        Core.inst.manager.ui.loadRes(this, path, type, callback);
    }

    /**
     * 预加载UI目录下resources里面的资源
     * @param path 相对于resources的路径
     * this.preloadRes('Bag', Prefab)
     */
    protected preloadRes<T extends typeof Asset>(path: string, type: T) {
        Core.inst.manager.ui.preloadRes(this, path, type);
    }

    /**
     * 加载UI目录下resources里面的资源
     * @param path 相对于resources的路径
     * @param callback 回调
     * this.loadResDir('Bag', Prefab, function(asset){})
     */
    protected loadResDir<T extends typeof Asset>(path: string, type: T, callback?: (result: InstanceType<T>[]) => any) {
        Core.inst.manager.ui.loadResDir(this, path, type, callback);
    }

    /**
     * 预加载UI目录下resources里面的资源
     * @param path 相对于resources的路径
     * this.preloadResDir('Bag', Prefab)
     */
    protected preloadResDir<T extends typeof Asset>(path: string, type: T) {
        Core.inst.manager.ui.preloadResDir(this, path, type);
    }

    /**
     * 设置字体资源
     * @param path UI的resources目录下的相对路径
     */
    protected setFont(target: Label, path: string, onComplete?: (success: boolean) => any) {
        this.loadRes(path, Font, (font) => {
            if (!font || !isValid(target)) {
                return onComplete && onComplete(false);
            }
            target.font = font;
            onComplete && onComplete(true);
        });
    }

    /**
     * 设置Spine资源
     * @param path UI的resources目录下的相对路径
     */
    protected setSpine(target: sp.Skeleton, path: string, onComplete?: (success: boolean) => any) {
        this.loadRes(path, sp.SkeletonData, (skeletonData) => {
            if (!skeletonData || !isValid(target)) {
                return onComplete && onComplete(false);
            }
            target.skeletonData = skeletonData;
            onComplete && onComplete(true);
        });
    }

    /**
     * 设置图片资源
     * @param path UI的resources目录下的相对路径
     */
    protected setSprite(target: Sprite, path: string, onComplete?: (success: boolean) => any) {
        this.loadRes(path, SpriteFrame, (spriteFrame) => {
            if (!spriteFrame || !isValid(target)) {
                return onComplete && onComplete(false);
            }
            target.spriteFrame = spriteFrame;
            onComplete && onComplete(true);
        });
    }

    protected log(...args: any[]) {
        log(
            `%c ${this._base_view_name} %c %s %c`,
            'background:#1e90ff ; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #1e90ff; color: #fff;',
            'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #1e90ff; color: #1e90ff;',
            args.join(' '),
            'background:transparent'
        );
    }

    protected warn(...args: any[]) {
        log(
            `%c ${this._base_view_name} %c %s %c`,
            'background:#eccc68 ; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #eccc68; color: #fff;',
            'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #eccc68; color: #eccc68;',
            args.join(' '),
            'background:transparent'
        );
    }

    protected error(...args: any[]) {
        error(
            `%c ${this._base_view_name} %c %s %c`,
            'background:#ff4757 ; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #ff4757; color: #fff;',
            'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #ff4757; color: #ff4757;',
            args.join(' '),
            'background:transparent'
        );
    }

    //////////////以下为可重写//////////////
    /**
    * 展示
    * @param data 传递给onShow的参数
    * @returns 
    */
    protected onShow(data?: any): any {
        return data;
    }

    /**
     * 隐藏
     * @param data 传递给onHide的参数
     * @returns 
     */
    protected onHide(data?: any): any {
        return data;
    }

    /**
     * 失去焦点
     * @returns 
     */
    protected onLostFocus(): any {
        return true;
    }

    /**
     * 获得焦点
     * @returns 
     */
    protected onFocus(): any {
        return true;
    }

    /**
     * onShow前调用
     * @param next 回调，传递的error不为空时，表示错误，onShow不会执行
     * @param data 传递给onShow的参数
     */
    protected beforeShow(next: (error?: string) => void, data?: any): any {
        next(null);
    }

    /**
     * hide前调用
     * @param data 传递给onHide的参数
     * @returns 如果返回字符串，则表示错误信息
     */
    protected beforeHide(data?: any): string | void {
        return null;
    }

    /**
     * onShow报错会执行
     */
    protected onError(): any {
        return;
    }

    /**
     * 背景遮照的参数
     */
    protected onShade(): IShade {
        return {};
    }
}