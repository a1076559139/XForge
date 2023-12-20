import { Asset, Component, Enum, EventTouch, Node, Scene, UITransform, Widget, _decorator, director, error, js, log } from 'cc';
import { EDITOR } from 'cc/env';
import { IMiniViewName, IMiniViewNames, IViewName } from '../../../../assets/app-builtin/app-admin/executor';
import Core from '../Core';
import { IBaseControl } from './BaseControl';

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

interface IEvent<E> {
    on(type: E[keyof E], callback: (arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any) => void, target?: any): void;
    once(type: E[keyof E], callback: (arg1?: any, arg2?: any, arg3?: any, arg4?: any, arg5?: any) => void, target?: any): void;
    off(type: E[keyof E], callback?: Function, target?: any): void;
    targetOff(target: any): void;
}

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

enum ViewState {
    BeforeShow,
    Showing,
    Showed,
    BeforeHide,
    Hiding,
    Hid,
}

const Group = { id: 'BaseView', name: 'settings', displayOrder: -Infinity };

@ccclass('BaseView')
export default class BaseView<SHOW_DATA = any, HIDE_DATA = any> extends Component {
    static BindControl<SHOW_DATA = any, HIDE_DATA = any, T = any, E = any>(control: IBaseControl<T, E>) {
        return class BindControl extends BaseView<SHOW_DATA, HIDE_DATA> {
            private _base_view_control: IBaseControl<T, E> = control;
            protected get control(): Pick<T, keyof T> & Readonly<IEvent<E>> {
                return this._base_view_control ? this._base_view_control.inst as any : null;
            }
        };
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
    private _base_mini_showing: Set<IMiniViewName> = new Set();

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
            this.log('Page3D只能destroy模式');
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
        tooltip: '是否捕获焦点<响应onLostFocus和onFocus>\n1、非UI_2D分组下会失效\n2、当一个捕获焦点的UI处于最上层并展示时\n下层的UI永远不会响应focus事件',
        visible(this: BaseView) {
            return this.is2D();
        }
    })
    protected get captureFocus() {
        if (this.is3D()) return false;
        return this._captureFocus;
    }
    protected set captureFocus(value) {
        if (value && this.is3D()) {
            this.log('只有UI_2D可以捕获焦点');
            return;
        }
        this._captureFocus = value;
    }

    @property
    private _shade = true;
    @property({
        group: Group,
        tooltip: '是否需要底层遮罩\n1、非UI_2D分组下会失效\n2、为Page类型时会失效',
        visible(this: BaseView) {
            return this.is2D();
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
                this.log('只有UI_2D可以设置底层遮罩');
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
        tooltip: '是否阻断输入\n1、非UI_2D分组下会失效',
        visible(this: BaseView) {
            return this.is2D();
        }
    })
    protected get blockInput() {
        if (this.is3D()) return false;
        return this._blockInput;
    }
    protected set blockInput(value) {
        if (value && this.is3D()) {
            this.log('只有UI_2D可以设置阻断输入');
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
     * 是否展示了
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
        this._base_mini_showing.clear();
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
        if (this.miniViews.length === 0) return false;
        if (views.length === 0) return false;
        if (this.typeName !== ViewType.Page) return false;

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

        if (this.miniViews.length === 0) return task;
        if (this.typeName !== ViewType.Page) return task;

        views = views.filter(name => {
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
                        attr: { zIndex: this.miniViews.indexOf(name) - this.miniViews.length },
                        onShow: (result) => {
                            this._base_mini_showing.add(name);
                            if (onShow) onShow(name, result);
                            next();
                        },
                        onHide: (result) => {
                            this._base_mini_show.delete(name);
                            this._base_mini_showing.delete(name);
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

    private show(data?: SHOW_DATA, attr?: IShowParamAttr, onShow?: IShowParamOnShow, onHide?: IShowParamOnHide, beforeShow?: IShowParamBeforeShow) {
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
            if (!error) {
                // 设置展示中
                if (changeState) this._base_view_state = ViewState.Showing;
                onHide && this.node.once('onHide', onHide);

                // 触发onCreate
                if (this._isOnCreateCalled === false) {
                    this._isOnCreateCalled = true;
                    this.onCreate();
                }

                // 正式显示ui并触发系统生命周期函数
                // 触发onLoad、onEnable
                if (this.node.active !== true) { this.node.active = true; }

                // 设置属性
                this.setNodeAttr(attr);

                // 设置遮罩
                // 触发focus逻辑
                Core.inst.manager.ui.refreshShade();
            }
            beforeShow && beforeShow(error);
            if (!error) {
                let result = null;
                try {
                    result = this.onShow(data);
                } catch (err) {
                    this.onError();
                    this.error('[onShow]', err);
                    console.error(err);
                }

                try {
                    onShow && onShow(result);
                    this.node.emit('onShow', result);
                    Core.inst.manager.ui.emit(this._base_view_name, { event: 'onShow', result: result });
                    Core.inst.manager.ui.emit('onShow', { name: this._base_view_name, result: result });
                } catch (err) {
                    this.error('[show]', err);
                }

                if (changeState) this._base_view_state = ViewState.Showed;
            } else {
                if (changeState) this._base_view_state = ViewState.Hid;
            }

            if (this._base_show_hide_delays.length > 0) {
                this._base_show_hide_delays.shift()();
            }
        };

        let isNextCalled = false;
        this.beforeShow((error) => {
            if (isNextCalled) return this.warn('[beforeShow] next被重复调用');
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
        const error = this.beforeHide(data);
        if (!error) {
            if (changeState) this._base_view_state = ViewState.Hiding;
            this.hideAllMiniViews(data);

            let result = null;
            try {
                result = this.onHide(data);
            } catch (error) {
                this.error('[onHide]', error);
            }

            try {
                onHide && onHide(result);
                this.node.emit('onHide', result);
                Core.inst.manager.ui.emit(this._base_view_name, { event: 'onHide', result: result });
                Core.inst.manager.ui.emit('onHide', { name: this._base_view_name, result: result });
            } catch (error) {
                this.error('[hide]', error);
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

    // 以下为可重写
    protected onShow(data?: SHOW_DATA): any {
        return data;
    }

    protected onHide(data?: HIDE_DATA): any {
        return data;
    }

    protected onLostFocus(): any {
        return true;
    }

    protected onFocus(): any {
        return true;
    }

    protected beforeShow(next: (error?: string) => void, data?: SHOW_DATA): any {
        next(null);
    }

    protected beforeHide(data?: HIDE_DATA): string {
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