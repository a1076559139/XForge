import { _decorator } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { IMiniViewNames } from '../../../../../app-builtin/app-admin/executor';
const { ccclass, property } = _decorator;
@ccclass('PageGame')
export class PageGame extends BaseView {
    // 子界面列表，数组顺序为子界面排列顺序
    protected miniViews: IMiniViewNames = ['PaperGameIndex', 'PaperAllIndex'];
    // 初始化的相关逻辑写在这
    onLoad() { }

    protected beforeShow(next: (error?: string) => void, data?: any) {
        this.showMiniViews({
            views: ['PaperGameIndex'],
            onFinish: next
        });
    }

    // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)
    onShow(params: any) {
        this.showMiniViews({
            views: ['PaperAllIndex']
        });
    }

    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
    onHide(result: undefined) {
        // app.manager.ui.show<PageGame>({name: 'PageGame', onHide:(result) => { 接收到return的数据，并且有类型提示 }})
        return result;
    }
}