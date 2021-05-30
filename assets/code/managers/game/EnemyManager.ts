import { _decorator, Component, Node, Prefab, Vec3, instantiate, NodePool } from 'cc';
import EnemyComponent from '../../ecs-components/EnemyComponent';
import PositionComponent from '../../ecs-components/PositionComponent';
import VelocityComponent from '../../ecs-components/VelocityComponent';
import math from '../../tools/math';
import { BlastEffectManager } from '../effect/BlastEffectManager';
import { LightningEffectManager } from '../effect/LightningEffectManager';
import { ShardEffectManager } from '../effect/ShardEffectManager';
import { GameManager } from '../GameManager';
const { ccclass, property } = _decorator;


// 位置信息
const poss1 = [
    new Vec3(-3.42, 0, -28),
    new Vec3(-2.28, 0, -28),
    new Vec3(-1.14, 0, -28),
    new Vec3(0, 0, -28),
    new Vec3(1.14, 0, -28),
    new Vec3(2.28, 0, -28),
    new Vec3(3.42, 0, -28)
]

const poss2 = [
    new Vec3(-2.85, 0, -28),
    new Vec3(-1.71, 0, -28),
    new Vec3(-0.57, 0, -28),
    new Vec3(0.57, 0, -28),
    new Vec3(1.71, 0, -28),
    new Vec3(2.85, 0, -28)
]

const poss3 = [
    new Vec3(-2.28, 0, -28),
    new Vec3(-1.14, 0, -28),
    new Vec3(0, 0, -28),
    new Vec3(1.14, 0, -28),
    new Vec3(2.28, 0, -28)
]

// 白色、黄色、橘色、红色、黑色
const MAXBLOOD = [
    100,
    300,
    1000
];
const BLOODRANGE: [number, number][] = [
    [10, 99],
    [100, 299],
    [300, 999]
];

function getRangeInt(range: [number, number]) {
    const min = range[0];
    const max = range[1];
    return Math.floor(math.random.get() * (max - min) + min);
}

let instance: EnemyManager | null = null;

@ccclass('EnemyManager')
export class EnemyManager extends Component {
    static get instance() { return instance; }
    onLoad() { instance = this; }

    @property(Node)
    private enemys: Node = null!;

    @property(Prefab)
    private enemy: Prefab = null!;

    private enemyPool: NodePool = new NodePool();
    create() {
        let node: Node = null!;
        if (this.enemyPool.size()) {
            node = this.enemyPool.get()!;
        } else {
            node = instantiate(this.enemy);
        }
        node.setParent(this.enemys);

        // 大小颜色
        const size = Math.floor(math.random.get() * 3);
        const color = Math.floor(math.random.get() * 5);

        // 位置
        let pos: Vec3 | null = null;
        if (size === 0) {
            pos = poss1[Math.floor(math.random.get() * poss1.length)];
        } else if (size === 1) {
            pos = poss2[Math.floor(math.random.get() * poss2.length)];
        } else {
            pos = poss3[Math.floor(math.random.get() * poss3.length)];
        }

        // 血量
        const blood = getRangeInt(BLOODRANGE[size]);
        const maxBlood = MAXBLOOD[size];

        const position = node.getComponent(PositionComponent);
        position!.set(pos);

        const enemy = node.getComponent(EnemyComponent);
        enemy?.init(blood, maxBlood, color, size + 1);

        const velocity = node.getComponent(VelocityComponent);
        velocity?.init(0, 0, 1);

        return size;
    }

    recovery(enemy: Node) {
        LightningEffectManager.instance?.createEffect(enemy.position);
        ShardEffectManager.instance?.createEffect(enemy.position);
        BlastEffectManager.instance?.createEffect(enemy.position);
        GameManager.instance?.shakeEffect();
        this.enemyPool.put(enemy);
    }

    recoveryAll() {
        this.enemys.destroyAllChildren();
    }
}