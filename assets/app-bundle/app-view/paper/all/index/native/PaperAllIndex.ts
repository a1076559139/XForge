import { _decorator, Node } from 'cc';
import BaseView from '../../../../../../../extensions/app/assets/base/BaseView';
const { ccclass, property } = _decorator;
@ccclass('PaperAllIndex')
export class PaperAllIndex extends BaseView {
    // 子界面列表，数组顺序为子界面排列顺序
        // 初始化的相关逻辑写在这
    onLoad(){}

    // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)
    onShow(params: any){}

    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
    onHide(result: undefined){
        // app.manager.ui.show<PaperAllIndex>({name: 'PaperAllIndex', onHide:(result) => { 接收到return的数据，并且有类型提示 }})
        return result;
    }
}