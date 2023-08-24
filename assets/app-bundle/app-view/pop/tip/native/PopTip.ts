import { _decorator, Button, Label, Node } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
const { ccclass, property } = _decorator;
@ccclass('PopTip')
export class PopTip extends BaseView {
    @property(Label)
    title: Label;

    @property(Node)
    close: Node;

    // 初始化的相关逻辑写在这
    onLoad() { 
        this.close.on(Button.EventType.CLICK, this.hide, this);
    }

    // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)
    onShow(params: string) {
        this.title.string = `被${params}打开`;
    }

    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
    onHide(result: undefined) {
        // app.manager.ui.show<PopTip>({name: 'PopTip', onHide:(result) => { 接收到return的数据，并且有类型提示 }})
        return result;
    }
}