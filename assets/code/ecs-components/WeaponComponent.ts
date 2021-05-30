
import { _decorator, Prefab, instantiate, Material } from 'cc';
import EcsComponent from '../../ecs/EcsComponent';
const { ccclass, property } = _decorator;

@ccclass('WeaponComponent')
export default class WeaponComponent extends EcsComponent {
    @property([Material])
    private materials: Material[] = [];

    @property(Node)
    private face: Node = null!;

    roleid = ''
}
