import { _decorator } from 'cc';
import BaseAppInit from '../../../extensions/app/assets/base/BaseAppInit';
const { ccclass } = _decorator;

@ccclass('AppInit')
export class AppInit extends BaseAppInit {
    onLoad() {
        // 执行初始化操作
    }

    onFinish() {
        // 执行完成操作
    }
}