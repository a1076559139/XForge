import { Component, NodePool, Prefab, Tween, UIOpacity, UITransform, _decorator, instantiate, tween, view } from 'cc';
import UIMgrToastCell from './UIMgrToastCell';
const { property, ccclass, requireComponent } = _decorator;

@ccclass('UIMgrToast')
@requireComponent(UITransform)
export default class UIMgrToast extends Component {
    @property(Prefab)
    private cell: Prefab = null;

    /**每条信息显示几秒 */
    private lifeTime = 2;

    /**消失时花费几秒渐隐 */
    private outTime = 0.2;

    /**挤压基础速度 */
    private squeezeSpeed = 200;

    /**节点缓存池子 */
    private pool = new NodePool();

    add(data: {
        message: string,
        timeout?: number
    }) {
        const cell = this.pool.get() || instantiate(this.cell);
        cell.setPosition(0, 0, 0);
        cell.parent = this.node;
        cell.active = true;

        cell.getComponent(UIMgrToastCell).init(data.message);

        cell.getComponent(UIOpacity).opacity = 255;
        tween(cell.getComponent(UIOpacity))
            .delay(data.timeout || this.lifeTime)
            .to(this.outTime, { opacity: 0 })
            .call(() => {
                this.pool.put(cell);
            })
            .start();
    }

    clear() {
        const children = this.node.children;
        for (let index = children.length - 1; index >= 0; index--) {
            Tween.stopAllByTarget(children[index].getComponent(UIOpacity));
            children[index].destroy();
        }
    }

    get size() {
        return this.node.children.length;
    }

    protected onDestroy() {
        this.clear();
        this.pool.clear();
    }

    protected update(dt: number) {
        const children = this.node.children;
        for (let index = children.length - 1, recovery = false; index >= 0; index--) {
            const zero = index === children.length - 1;
            const curr = children[index];

            // 直接触发回收逻辑
            if (recovery) {
                Tween.stopAllByTarget(curr.getComponent(UIOpacity));
                this.pool.put(curr);
                continue;
            }

            if (zero) {
                const currUT = curr.getComponent(UITransform);

                const lastMaxY = 0 - currUT.height / 2;
                const currMinY = curr.position.y + lastMaxY;

                if (currMinY > lastMaxY) {
                    // 存在空隙
                    const addLen = Math.max(-this.squeezeSpeed * dt * (children.length - index), lastMaxY - currMinY);
                    curr.setPosition(curr.position.add3f(0, addLen, 0));
                }
            } else {
                const last = children[index + 1];
                const currUT = curr.getComponent(UITransform);
                const lastUT = last.getComponent(UITransform);

                const currMinY = curr.position.y - currUT.height / 2 - 6;//6像素的间隔
                const lastMaxY = last.position.y + lastUT.height / 2;

                if (currMinY < lastMaxY) {
                    // 存在重叠
                    const addLen = Math.min(this.squeezeSpeed * dt * (children.length - index - 1), lastMaxY - currMinY);
                    curr.setPosition(curr.position.add3f(0, addLen, 0));
                    const winSize = view.getVisibleSize();
                    if (currMinY > winSize.height / 2) {
                        // 触发回收逻辑
                        recovery = true;
                        Tween.stopAllByTarget(curr.getComponent(UIOpacity));
                        this.pool.put(curr);
                    }
                } else if (currMinY > lastMaxY) {
                    // 存在空隙
                    const addLen = Math.max(-this.squeezeSpeed * dt * (children.length - index), lastMaxY - currMinY);
                    curr.setPosition(curr.position.add3f(0, addLen, 0));
                }
            }
        }
    }
}