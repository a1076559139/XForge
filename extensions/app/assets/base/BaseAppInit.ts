import { assetManager, Component, warn, _decorator } from 'cc';
import { EDITOR } from 'cc/env';
import Core from '../Core';
import BaseManager from './BaseManager';
const { ccclass, property } = _decorator;

const AdminBundleName = 'app-admin';
const ModelBundleName = 'app-model';
const ControlBundlename = 'app-control';
const ExtendBundlename = 'app-extend';
const DotReWriteFuns = ['startInit', 'nextInit', 'getAppAssetNum'];

@ccclass('BaseAppInit')
export default abstract class BaseAppInit extends Component {
    private _base_app_total = 0;
    private _base_user_total = 0;

    private _base_total = 0;
    private _base_completed = 0;

    constructor() {
        super();
        if (EDITOR) {
            DotReWriteFuns.forEach((funName) => {
                if (BaseAppInit.prototype[funName] !== this[funName]) {
                    warn(`[AppInit] [warn] 不应该重写父类方法{${funName}}`);
                }
            });
        }
    }

    /**
     * [避免重写] 开始初始化
     */
    protected startInit() {
        Core.inst.lib.task.createAny()
            .add([
                (next, retry) => {
                    // 加载model
                    assetManager.loadBundle(ModelBundleName, (err) => {
                        if (err) return retry(0.1);
                        next();
                    })
                },
                (next, retry) => {
                    // 加载control
                    assetManager.loadBundle(ControlBundlename, (err) => {
                        if (err) return retry(0.1);
                        next();
                    })
                },
                (next, retry) => {
                    // 加载extend
                    assetManager.loadBundle(ExtendBundlename, (err) => {
                        if (err) return retry(0.1);
                        next();
                    })
                }
            ])
            .add([
                (next, retry) => {
                    // 加载admin
                    assetManager.loadBundle(AdminBundleName, (err) => {
                        if (err) return retry(0.1);
                        next();
                    })
                },
                (next) => {
                    // 加载manager
                    BaseManager.init(next);
                }
            ])
            .start(() => {
                // 获得app初始化所加载的资源总量
                this._base_app_total = this.getAppAssetNum();
                this._base_user_total = this.getUserAssetNum();

                this._base_completed = 0;
                this._base_total = this._base_app_total + this._base_user_total;

                this.onProgress(0, this._base_total);

                // 初始化app, 使用complete来实现onUserInit的切换以确保manager已完全加载
                BaseManager.initManagers(() => this.nextInit(), (): any => { this.onUserInit(this._base_completed - this._base_app_total); });
            })
    }
    /**
     * [避免重写] 初始化下一步，用户部分每完成一步需要调用一次
     */
    protected nextInit(): any {
        if (this._base_completed === this._base_total) {
            return;
        }
        this.onProgress(++this._base_completed, this._base_total);
        // 全部加载完成
        if (this._base_completed === this._base_total) {
            Core.inst.emit(Core.EventType.EVENT_APPINIT_FINISHED);
            return Core.inst.manager.ui.showDefault(() => {
                // 销毁当前节点
                this.node.active = false;
                this.node.parent = null;
                this.node.destroy();
                // 播放默认音乐
                Core.inst.manager.sound.playDefaultMusic();
            });
        }
        // 系统部分加载完毕，开始加载用户自定义
        if (this._base_completed > this._base_app_total) {
            this.onUserInit(this._base_completed - this._base_app_total);
        }
    }

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    ////////////////////////////////////////////        以下可重写        ////////////////////////////////////////////
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * [不可重写] 获得用户资源总量
     */
    protected getAppAssetNum(): number {
        return BaseManager.getInitAssetNum();
    }

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
}