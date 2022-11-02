import { _decorator } from 'cc';
import BaseView from '../../../../../../extensions/app/assets/base/BaseView';
import { IMiniViewNames } from '../../../../../app-builtin/app-admin/executor';
import { app } from '../../../../../app/app';
const { ccclass, property } = _decorator;
@ccclass('PageGame')
export class PageGame extends BaseView {
    // 子界面(paper)
    protected miniViews: IMiniViewNames = ['PaperGameIndex'];

    // 初始化的相关逻辑写在这
    onLoad() { }

    // 界面打开时的相关逻辑写在这(onShow可被多次调用-它与onHide不成对)
    onShow(params: any) {
        // 🔥PaperGameIndex里面isViewValid返回false，可以试试改为true
        this.showMiniViews({
            views: ['PaperGameIndex']
        })
        // 🔥一般情况下page内只有背景UI，其它按钮等都在paper里面，通过miniViews的顺序调整paper的顺序
    }

    // 界面关闭时的相关逻辑写在这(已经关闭的界面不会触发onHide)
    onHide(result: undefined) {
        // app.manager.ui.show<PageGame>({name: 'PageGame', onHide:(result) => { 接收到return的数据，并且有类型提示 }})
        return result;
    }

    private onClick() {
        app.manager.ui.show({
            name: 'PopTip'
        })
    }
}