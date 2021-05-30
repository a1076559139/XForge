/**
 * 爆炸
 */
import { _decorator, Component, Node, Prefab, Vec3, instantiate, ParticleSystem, NodePool } from 'cc';
const { ccclass, property } = _decorator;


let instance: BlastEffectManager | null = null;

@ccclass('BlastEffectManager')
export class BlastEffectManager extends Component {
    static get instance() { return instance; }
    onLoad() { instance = this; }

    @property(Node)
    layer: Node = null!;

    @property(Prefab)
    blast: Prefab = null!;

    private blastPool: NodePool = new NodePool();
    private createBlast() {
        let node: Node = null!;
        if (this.blastPool.size()) {
            node = this.blastPool.get()!;
        } else {
            node = instantiate(this.blast);
        }
        node.setParent(this.layer);
        return node;
    }

    createEffect(pos: Vec3) {
        if (this.layer.children.length > 10) return;

        const node = this.createBlast();
        node.setPosition(new Vec3(pos.x, 0, pos.z));

        const com = node.getComponent(ParticleSystem);
        com!.play();
    }

    private recoveryBlast(blast: Node) {
        this.blastPool.put(blast);
    }

    update() {
        const childrens = this.layer.children;
        for (let index = childrens.length - 1; index >= 0; index--) {
            const node = childrens[index];
            const com = node.getComponent(ParticleSystem);
            if (!com || com.isStopped) {
                com?.stop();
                this.recoveryBlast(node);
            }
        }
    }
}