import { Component, Label, UIOpacity, UITransform, _decorator } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('UIMgrToastCell')
@requireComponent(UIOpacity)
@requireComponent(UITransform)
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

    unuse() {
        this.title.string = '';
    }
}

