import { _decorator, Component, Node, Prefab, Vec3, instantiate, NodePool, Material, MeshRenderer } from 'cc';
import BulletComponent from '../../ecs-components/BulletComponent';
import PositionComponent from '../../ecs-components/PositionComponent';
import VelocityComponent from '../../ecs-components/VelocityComponent';
const { ccclass, property } = _decorator;

const DPS = [
    {
        pos: [[0, 0, 0]],
        direction: [[0, 0, -1]]
    }, {
        pos: [[-0.2, 0, 0], [0.2, 0, 0]],
        direction: [[0, 0, -1], [0, 0, -1]]
    }, {
        pos: [[0, 0, 0], [0, 0, 0], [0, 0, 0]],
        direction: [[-0.05, 0, -1], [0, 0, -1], [0.05, 0, -1]]
    }, {
        pos: [[-0.2, 0, 0], [-0.2, 0, 0], [0.2, 0, 0], [0.2, 0, 0]],
        direction: [[-0.05, 0, -1], [0, 0, -1], [0, 0, -1], [0.05, 0, -1]]
    }, {
        pos: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]],
        direction: [[-0.1, 0, -1], [-0.05, 0, -1], [0, 0, -1], [0.05, 0, -1], [0.1, 0, -1]]
    }
]

let instance: ButtleManager | null = null;

@ccclass('ButtleManager')
export class ButtleManager extends Component {
    static get instance() { return instance; }
    onLoad() { instance = this; }

    @property(Node)
    private buttles: Node = null!;

    @property(Prefab)
    private buttle: Prefab = null!;

    private buttlePool: NodePool = new NodePool();
    private _createButtle() {
        let node: Node = null!;
        if (this.buttlePool.size()) {
            node = this.buttlePool.get()!;
        } else {
            node = instantiate(this.buttle);
        }
        node.setParent(this.buttles);
        return node;
    }
    create(weapon: Node, num: number = 1) {
        if (num < 1) num = 1;

        const dp = DPS[num - 1];
        const weaponPos = weapon.getComponent(PositionComponent)!;

        const self = weapon.name === 'self';

        for (let index = 0; index < num; index++) {
            const node: Node = this._createButtle();

            const p = dp.pos[index];
            const d = dp.direction[index];

            const bullet = node.getComponent(BulletComponent);
            bullet!.init(3, self);

            const v = node.getComponent(VelocityComponent);
            v!.init(d[0], d[1], d[2], 10);

            const pos = node.getComponent(PositionComponent);
            pos!.set3f(
                weaponPos.x + p[0],
                weaponPos.y + p[1],
                weaponPos.z + p[2]
            );
        }
    }

    recovery(buttle: Node) {
        this.buttlePool.put(buttle);
    }

    recoveryAll() {
        this.buttles.destroyAllChildren();
    }
}