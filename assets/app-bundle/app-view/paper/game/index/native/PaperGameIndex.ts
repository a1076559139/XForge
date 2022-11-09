import { _decorator } from 'cc';
import BaseView from '../../../../../../../extensions/app/assets/base/BaseView';
import { app } from '../../../../../../app/app';
const { ccclass, property } = _decorator;
@ccclass('PaperGameIndex')
export class PaperGameIndex extends BaseView {
    // 初始化的相关逻辑写在这
    onLoad() { }

    // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)
    onShow(params: any) { }

    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
    onHide(result: undefined) {
        // app.manager.ui.show<PaperGameIndex>({name: 'PaperGameIndex', onHide:(result) => { 接收到return的数据，并且有类型提示 }})
        return result;
    }

    private onClickOpen() {
        app.manager.ui.show({
            name: 'PopTip'
        })
    }
}