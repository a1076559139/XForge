import { _decorator, Component, Node, Prefab, Vec3, instantiate, NodePool, MeshRenderer, Material } from 'cc';
import WeaponComponent from '../../ecs-components/WeaponComponent';
const { ccclass, property } = _decorator;


let instance: WeaponManager | null = null;

@ccclass('WeaponManager')
export class WeaponManager extends Component {
    static get instance() { return instance; }
    onLoad() { instance = this; }

    @property(Node)
    private weapons: Node = null!;

    @property(Prefab)
    private weapon: Prefab = null!;

    @property(Material)
    private self: Material = null!;

    @property(Material)
    private other: Material = null!;


    create(roleid: string, self = false) {
        const node = instantiate(this.weapon);
        if (self) node.name = 'self';
        node.getComponent(MeshRenderer)?.setMaterial(self ? this.self : this.other, 0);

        node.setParent(this.weapons);
        const weapon = node.getComponent(WeaponComponent)!;
        weapon.roleid = roleid;
        return node;
    }

    recoveryAll() {
        this.weapons.destroyAllChildren();
    }
}