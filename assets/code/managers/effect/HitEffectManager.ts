/**
 * 受击
 */
import { _decorator, Component, Node, Prefab, NodePool, instantiate, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
import { Gif } from '../../components/Gif';

let instance: HitEffectManager | null = null;

@ccclass('HitEffectManager')
export class HitEffectManager extends Component {
    static get instance() { return instance; }
    onLoad() { instance = this; }

    @property(Node)
    layer: Node = null!;

    @property(Prefab)
    effect: Prefab = null!;

    private effectPool: NodePool = new NodePool();
    private createNode() {
        let node: Node = null!;
        if (this.effectPool.size()) {
            node = this.effectPool.get()!;
        } else {
            node = instantiate(this.effect);
        }
        node.setParent(this.layer);
        return node;
    }

    createEffect(pos: Vec3) {
        const node = this.createNode();
        node.setPosition(new Vec3(pos.x, pos.y, pos.z));

        const com = node.getComponent(Gif);
        com!.play();
    }

    private recoveryNode(effect: Node) {
        this.effectPool.put(effect);
    }

    update() {
        const childrens = this.layer.children;
        for (let index = childrens.length - 1; index >= 0; index--) {
            const node = childrens[index];
            const com = node.getComponent(Gif);
            if (!com || !com.running) {
                com?.stop();
                this.recoveryNode(node);
            }
        }
    }
}