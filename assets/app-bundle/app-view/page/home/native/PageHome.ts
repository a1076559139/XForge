import { _decorator } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { IMiniViewNames, MiniViewName } from '../../../../../app-builtin/app-admin/executor';
const { ccclass, property } = _decorator;
@ccclass('PageHome')
export class PageHome extends BaseView {
    // 子界面列表，数组顺序为子界面排列顺序
    protected miniViews: IMiniViewNames = [MiniViewName.PaperHomeIndex, MiniViewName.PaperAllIndex];
    // 初始化的相关逻辑写在这
    protected onLoad() { }

    protected beforeShow(next: (error?: string) => void, data?: any) {
        this.showMiniViews({
            views: [MiniViewName.PaperHomeIndex],
            onFinish: next
        });
    }

    // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)
    protected onShow(params: any) {
        this.showMiniViews({
            views: [MiniViewName.PaperAllIndex]
        });
    }

    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
    protected onHide(result: undefined) {
        // app.manager.ui.show<PageHome>({name: 'PageHome', onHide:(result) => { 接收到return的数据，并且有类型提示 }})
        return result;
    }
}