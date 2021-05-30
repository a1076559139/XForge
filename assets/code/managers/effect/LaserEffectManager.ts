/**
 * 激光
 */
import { _decorator, Component, Node, Prefab, NodePool, instantiate, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
import { Gif } from '../../components/Gif';

let instance: LaserEffectManager | null = null;

@ccclass('LaserEffectManager')
export class LaserEffectManager extends Component {
    static get instance() { return instance; }
    onLoad() { instance = this; }

    @property(Node)
    layer: Node = null!;

    @property(Prefab)
    laser: Prefab = null!;

    private laserPool: NodePool = new NodePool();
    private createLightning() {
        let node: Node = null!;
        if (this.laserPool.size()) {
            node = this.laserPool.get()!;
        } else {
            node = instantiate(this.laser);
        }
        node.setParent(this.layer);
        return node;
    }

    createEffect(pos: Vec3) {
        if (this.layer.children.length > 10) return;

        const node = this.createLightning();
        node.setPosition(new Vec3(pos.x, node.position.y, node.position.z));

        const com = node.getComponent(Gif);
        com!.play();
    }

    private recoveryLaser(laser: Node) {
        this.laserPool.put(laser);
    }

    update() {
        const childrens = this.layer.children;
        for (let index = childrens.length - 1; index >= 0; index--) {
            const node = childrens[index];
            const com = node.getComponent(Gif);
            if (!com || !com.running) {
                com?.stop();
                this.recoveryLaser(node);
            }
        }
    }
}