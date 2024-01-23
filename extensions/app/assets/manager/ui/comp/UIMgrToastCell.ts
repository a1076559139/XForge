import { Component, Label, UITransform, _decorator } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UIMgrToastCell')
export default class UIMgrToastCell extends Component {
    @property(Label)
    private title: Label = null;

    init(title: string) {
        if (title.length > 30) {
            this.title.overflow = Label.Overflow.RESIZE_HEIGHT;
            this.title.getComponent(UITransform).width = 600;
        } else {
            this.title.overflow = Label.Overflow.NONE;
        }
        this.title.string = title;
        this.title.updateRenderData(true);
    }

    onDisable() {
        this.title.string = '';
    }
}

