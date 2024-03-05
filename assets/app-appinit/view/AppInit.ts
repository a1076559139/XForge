import { Node, UIOpacity, _decorator, tween } from 'cc';
import BaseAppInit from '../../../extensions/app/assets/base/BaseAppInit';
const { ccclass, property } = _decorator;

@ccclass('AppInit')
export class AppInit extends BaseAppInit {
    @property(Node)
    private logo: Node;

    /**
    * 获得用户资源总量，这里返回几，就需要用户自行调用几次nextInit
    */
    protected getUserAssetNum(): number {
        return 1;
    }

    protected onLoad() {
        // 执行初始化操作
        const opacity = this.logo.getComponent(UIOpacity);
        opacity.opacity = 0;
        tween(opacity)
            .to(0.5, { opacity: 255 })
            .delay(1)
            .to(0.5, { opacity: 0 })
            .call(() => {
                this.nextInit();
            })
            .start();
    }

    // BaseAppInit中使用start方法作为初始化入口，如果重写start方法，请注意调用父类方法
    // protected start() {  }

    protected onFinish() {
        // 执行完成操作
        this.node.destroy();
    }
}