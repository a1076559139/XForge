import { Component, Director, director, Node, _decorator } from 'cc';
const { ccclass } = _decorator;

@ccclass('UIMgrZOrder')
export default class UIMgrZOrder extends Component {
    private zOrder = false;
    private tempArr: Node[] = [];

    protected onLoad() {
        this.checkUpdateZOrder();
        this.node.on(Node.EventType.CHILD_ADDED, this.onChildAdded, this);
        this.node.on(Node.EventType.CHILD_REMOVED, this.onChildRemoveed, this);
        this.node.on(Node.EventType.SIBLING_ORDER_CHANGED, this.checkUpdateZOrder, this);
    }

    protected onDestroy() {
        director.off(Director.EVENT_AFTER_UPDATE, this.updateZOrder, this);
        this.node.off(Node.EventType.CHILD_ADDED, this.onChildAdded, this);
        this.node.off(Node.EventType.CHILD_REMOVED, this.onChildRemoveed, this);
        this.node.off(Node.EventType.SIBLING_ORDER_CHANGED, this.checkUpdateZOrder, this);
    }

    private onChildAdded(child: Node) {
        this.checkUpdateZOrder();
        child.on(Node.EventType.TRANSFORM_CHANGED, this.checkUpdateZOrder, this);
    }

    private onChildRemoveed(child: Node) {
        child.off(Node.EventType.TRANSFORM_CHANGED, this.checkUpdateZOrder, this);
    }

    private checkUpdateZOrder() {
        if (this.zOrder) return;
        this.zOrder = true;
        director.once(Director.EVENT_AFTER_UPDATE, this.updateZOrder, this);
    }

    /**
     * 更新节点树排序
     */
    public updateZOrder() {
        if (!this.zOrder) return;
        Array.prototype.push.apply(this.tempArr, this.node.children);
        this.tempArr
            .sort((a, b) => {
                return (a.position.z - b.position.z)
                    || (a.getSiblingIndex() - b.getSiblingIndex());
            })
            .forEach((child, index) => {
                child.setSiblingIndex(index);
            });

        // 一定要放到最后再设置false，
        // 避免更新过程中设置siblingIndex，
        // 导致无限重复调用
        this.zOrder = false;
        this.tempArr.length = 0;
    }
}

