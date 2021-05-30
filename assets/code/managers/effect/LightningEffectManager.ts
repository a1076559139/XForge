/**
 * 闪电
 */
import { _decorator, Component, Node, Prefab, NodePool, instantiate, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
import { Gif } from '../../components/Gif';

let instance: LightningEffectManager | null = null;

@ccclass('LightningEffectManager')
export class LightningEffectManager extends Component {
    static get instance() { return instance; }
    onLoad() { instance = this; }

    @property(Node)
    layer: Node = null!;

    @property(Prefab)
    lightning: Prefab = null!;

    private lightningPool: NodePool = new NodePool();
    private createLightning() {
        let node: Node = null!;
        if (this.lightningPool.size()) {
            node = this.lightningPool.get()!;
        } else {
            node = instantiate(this.lightning);
        }
        node.setParent(this.layer);
        return node;
    }

    createEffect(pos: Vec3) {
        if (this.layer.children.length > 10) return;

        const node = this.createLightning();
        node.setPosition(new Vec3(pos.x, 1 + pos.y, pos.z));

        const com = node.getComponent(Gif);
        com!.play();
    }

    private recoveryLightning(lightning: Node) {
        this.lightningPool.put(lightning);
    }

    update() {
        const childrens = this.layer.children;
        for (let index = childrens.length - 1; index >= 0; index--) {
            const node = childrens[index];
            const com = node.getComponent(Gif);
            if (!com || !com.running) {
                com?.stop();
                this.recoveryLightning(node);
            }
        }
    }
}