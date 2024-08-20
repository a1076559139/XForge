import { Button, Component, EventTouch, Node, Settings, _decorator, assetManager, isValid, settings, warn } from 'cc';
import { EDITOR } from 'cc/env';
import Core from '../Core';
import BaseManager from './BaseManager';
const { ccclass } = _decorator;

const AdminBundleName = 'app-admin';
const ModelBundleName = 'app-model';
const ControlBundleName = 'app-control';
const ControllerBundleName = 'app-controller';
const ManagerBundleName = 'app-manager';
const DotReWriteFuncs = ['startInit', 'nextInit'];

@ccclass('BaseAppInit')
export default abstract class BaseAppInit extends Component {
    private get _base_user_total() {
        return Math.max(0, this.getUserAssetNum());
    }
    private get _base_mgr_total() {
        return Math.max(0, BaseManager.getTotalAssetNum());
    }
    private get _base_total() {
        return this._base_mgr_total + this._base_user_total;
    }
    private _base_completed = 0;
    private _base_completed_cache = 0;
    private _base_inited = false;
    private _base_finished = false;

    constructor() {
        super();
        if (EDITOR) {
            DotReWriteFuncs.forEach((funName) => {
                if (BaseAppInit.prototype[funName] !== this[funName]) {
                    warn(`[AppInit] 不应该重写父类方法{${funName}}`);
                }
            });
        }
    }

    /**
     * [避免重写] 开始初始化
     */
    protected startInit() {
        const projectBundles = settings.querySettings(Settings.Category.ASSETS, 'projectBundles') as string[];
        Core.inst.lib.task.createAny()
            // 预加载control、model、admin、manager
            .add([
                (next, retry) => {
                    // 预加载control(废弃)
                    if (projectBundles.indexOf(ControlBundleName) === -1) return next();
                    assetManager.preloadAny({ url: ControlBundleName }, { ext: 'bundle' }, null, (err) => {
                        if (err) return retry(0.1);
                        next();
                    });
                },
                (next, retry) => {
                    // 预加载controller
                    if (projectBundles.indexOf(ControllerBundleName) === -1) return next();
                    assetManager.preloadAny({ url: ControllerBundleName }, { ext: 'bundle' }, null, (err) => {
                        if (err) return retry(0.1);
                        next();
                    });
                },
                (next, retry) => {
                    // 预加载model
                    if (projectBundles.indexOf(ModelBundleName) === -1) return next();
                    assetManager.preloadAny({ url: ModelBundleName }, { ext: 'bundle' }, null, (err) => {
                        if (err) return retry(0.1);
                        next();
                    });
                },
                (next, retry) => {
                    // 预加载admin
                    if (projectBundles.indexOf(AdminBundleName) === -1) return next();
                    assetManager.preloadAny({ url: AdminBundleName }, { ext: 'bundle' }, null, (err) => {
                        if (err) return retry(0.1);
                        next();
                    });
                },
                (next, retry) => {
                    // 预加载manage
                    if (projectBundles.indexOf(ManagerBundleName) === -1) return next();
                    assetManager.preloadAny({ url: ManagerBundleName }, { ext: 'bundle' }, null, (err) => {
                        if (err) return retry(0.1);
                        next();
                    });
                }
            ])
            // 加载control(废弃)
            .add((next, retry) => {
                if (projectBundles.indexOf(ControlBundleName) === -1) return next();
                assetManager.loadBundle(ControlBundleName, (err) => {
                    if (err) return retry(0.1);
                    next();
                });
            })
            // 加载controller
            .add((next, retry) => {
                if (projectBundles.indexOf(ControllerBundleName) === -1) return next();
                assetManager.loadBundle(ControllerBundleName, (err) => {
                    if (err) return retry(0.1);
                    next();
                });
            })
            // 加载model
            .add((next, retry) => {
                if (projectBundles.indexOf(ModelBundleName) === -1) return next();
                assetManager.loadBundle(ModelBundleName, (err) => {
                    if (err) return retry(0.1);
                    next();
                });
            })
            // 加载admin
            .add((next, retry) => {
                if (projectBundles.indexOf(AdminBundleName) === -1) return next();
                assetManager.loadBundle(AdminBundleName, (err) => {
                    if (err) return retry(0.1);
                    next();
                });
            })
            // 加载manager
            .add((next) => {
                BaseManager.init(ManagerBundleName, next);
            })
            .start(() => {
                this._base_inited = true;
                this.onProgress(0, this._base_total);

                // 初始化app, 使用complete来实现onUserInit的切换以确保manager已完全加载
                BaseManager.initManagers(() => {
                    this.nextInit();
                }, () => {
                    if (this._base_user_total <= 0) return;
                    this.onUserInit(this._base_completed - this._base_mgr_total);
                });
            });
    }

    /**
     * [避免重写] 初始化下一步，用户部分每完成一步需要调用一次
     */
    protected nextInit(): any {
        if (this._base_finished) return;
        if (!this._base_inited) {
            this._base_completed_cache += 1;
            return;
        }

        this._base_completed += 1;
        // 进度回调
        this.onProgress(this._base_completed + this._base_completed_cache, this._base_total);

        // 全部加载完成
        if (this._base_completed + this._base_completed_cache >= this._base_total) {
            this._base_finished = true;
            Core.emit(Core.EventType.EVENT_APPINIT_FINISHED);
            // 默认音效(Button点击触发, 这个方案可以正常触发input事件)
            if (Core.inst.Manager.Sound.setting.defaultEffectName) {
                const playDefaultEffect = function (e: EventTouch) {
                    // SoundManager.setButtonEffect会将Button所在节点的useDefaultEffect设为false
                    if (e.target['useDefaultEffect'] === false) return;
                    Core.inst.manager.ui.onceUserInterface(Node.EventType.TOUCH_END, function (event: EventTouch) {
                        if (!event.target.getComponent(Button)) return;
                        setTimeout(() => {
                            if (!isValid(Core.inst.manager.sound)) return;
                            // 如果是scrollView中的button，在滑动后不播放点击音效
                            if (event.eventPhase === EventTouch.CAPTURING_PHASE) return;
                            Core.inst.manager.sound.playDefaultEffect();
                        });
                    }, null, true);
                };
                const onEnable = Button.prototype.onEnable;
                Button.prototype.onEnable = function () {
                    onEnable.call(this);
                    this.node.on(Node.EventType.TOUCH_START, playDefaultEffect);
                };
                const onDisable = Button.prototype.onDisable;
                Button.prototype.onDisable = function () {
                    this.node.off(Node.EventType.TOUCH_START, playDefaultEffect);
                    onDisable.call(this);
                };
            }
            return Core.inst.manager.ui.showDefault(() => {
                // 初始化完成
                this.onFinish();
                // 默认音效(Button点击触发, 这个方案会阻挡input事件)
                // if (Core.inst.Manager.Sound.setting.defaultEffectName) {
                //     Core.inst.manager.ui.onUIRoot2D(Node.EventType.TOUCH_END, function (event: EventTouch) {
                //         if (!event.target.getComponent(Button)) return;
                //         setTimeout(() => {
                //             if (!isValid(Core.inst.manager.sound)) return;
                //             // 如果是scrollView中的button，在滑动后不播放点击音效
                //             if (event.eventPhase === EventTouch.CAPTURING_PHASE) return;
                //             Core.inst.manager.sound.playDefaultEffect();
                //         });
                //     }, null, true);
                // }
                // 默认音乐(默认播放)
                if (Core.inst.Manager.Sound.setting.defaultMusicName) {
                    const onTouch = function () {
                        if (!isValid(Core.inst.manager.sound)) return;
                        if (Core.inst.manager.sound.isMusicPlaying && !Core.inst.manager.sound.isMusicPaused) {
                            Core.inst.manager.sound.replayMusic(() => {
                                Core.inst.manager.ui.offUserInterface(Node.EventType.TOUCH_START, onTouch, this, true);
                            });
                        } else {
                            Core.inst.manager.ui.offUserInterface(Node.EventType.TOUCH_START, onTouch, this, true);
                        }
                    };
                    Core.inst.manager.ui.onUserInterface(Node.EventType.TOUCH_START, onTouch, this, true);
                    Core.inst.manager.sound.playDefaultMusic(() => {
                        Core.inst.manager.ui.offUserInterface(Node.EventType.TOUCH_START, onTouch, this, true);
                    });
                }
            });
        }

        // 系统部分加载完毕，开始加载用户自定义
        if (this._base_completed > this._base_mgr_total) {
            this.onUserInit(this._base_completed + this._base_completed_cache - this._base_mgr_total);
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////        以下可重写        ////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * [可以重写] 默认start调用startInit，可以重写后自定义时机
     */
    protected start(): any { this.startInit(); }

    /**
     * [建议重写] 监听进度
     * @param {Number} completed
     * @param {Number} total
     */
    protected onProgress(completed: number, total: number): any { return completed / total; }

    /**
     * [建议重写] 监听用户初始化数据
     * @param {Number} index
     */
    protected onUserInit(index: number): any { return index; }

    /**
     * [建议重写] 获得用户资源总量，这里返回几，就需要用户自行调用几次nextInit
     */
    protected getUserAssetNum(): number { return 0; }

    /**
     * [建议重写] 初始化完成
     */
    protected onFinish() { }
}