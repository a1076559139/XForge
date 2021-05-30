/**
 * 碎屑
 */
import { _decorator, Component, Node, Prefab, Vec3, tween, instantiate, NodePool } from 'cc';
const { ccclass, property } = _decorator;

const actions = [
    [
        new Vec3(0, 1, -1),
        new Vec3(0, -1, -3)
    ],
    [
        new Vec3(-0.7, 1, -0.7),
        new Vec3(-2.12, -1, -2.12)
    ],
    [
        new Vec3(-1, 1, 0),
        new Vec3(-3, -1, 0)
    ],
    [
        new Vec3(-0.7, 1, 0.7),
        new Vec3(-2.12, -1, 2.12)
    ],
    [
        new Vec3(0, 1, 1),
        new Vec3(0, -1, 3)
    ],
    [
        new Vec3(0.7, 1, 0.7),
        new Vec3(2.12, -1, 2.12)
    ],
    [
        new Vec3(1, 1, 0),
        new Vec3(3, -1, 0)
    ],
    [
        new Vec3(0.7, 1, -0.7),
        new Vec3(2.12, -1, -2.12)
    ]
]

let instance: ShardEffectManager | null = null;

@ccclass('ShardEffectManager')
export class ShardEffectManager extends Component {
    static get instance() { return instance; }
    onLoad() { instance = this; }

    @property(Node)
    layer: Node = null!;

    @property(Prefab)
    beat: Prefab = null!;

    private beatPool: NodePool = new NodePool();
    private createBeat() {
        let node: Node = null!;
        if (this.beatPool.size()) {
            node = this.beatPool.get()!;
        } else {
            node = instantiate(this.beat);
        }
        node.setParent(this.layer);
        return node;
    }

    private recoveryBeat(beat: Node) {
        this.beatPool.put(beat);
    }

    createEffect(pos: Vec3) {
        if (this.layer.children.length > 40) return;

        for (let index = 0; index < actions.length; index++) {
            const [up, down] = actions[index];

            const node = this.createBeat();
            node.setPosition(new Vec3(pos.x, node.scale.y / 2, pos.z));

            tween(node)
                // 上升
                .by(0.2, { position: new Vec3(up.x, up.y, up.z) }, { easing: "quadOut" })
                // 下降
                .parallel(
                    tween().by(0.5, { position: new Vec3(down.x, 0, down.z) }),
                    tween().by(0.5, { position: new Vec3(0, down.y, 0) }, { easing: "bounceOut" })
                )
                .delay(0.5)
                // 销毁
                .call((target: Node) => {
                    this.recoveryBeat(target);
                })
                .start();
        }
    }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.0/manual/en/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.0/manual/en/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.0/manual/en/scripting/life-cycle-callbacks.html
 */
