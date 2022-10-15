import { _decorator } from 'cc';
import BaseManager from '../../../../extensions/app/assets/base/BaseManager';
const { ccclass, property } = _decorator;
@ccclass('GameManager')
export class GameManager extends BaseManager {
    // [无序] 加载完成时触发
    protected onLoad() { }

    // [无序] 自身初始化完成, init执行完毕后被调用
    protected onInited() { }

    // [无序] 所有manager初始化完成
    protected onFinished() { }

    // [无序] 初始化manager，在初始化完成后，调用finish方法
    protected init(finish: Function) {
        super.init(finish);
    }
}