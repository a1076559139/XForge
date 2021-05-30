
import { _decorator, Component, Node, Label, Material, MeshRenderer } from 'cc';
import EcsComponent from '../../ecs/EcsComponent';
import PositionComponent from './PositionComponent';
const { ccclass, property } = _decorator;

@ccclass('EnemyComponent')
export default class EnemyComponent extends EcsComponent {
    @property([Material])
    private materials: Material[] = [];

    @property(Node)
    private face: Node = null!;

    @property(Label)
    private display: Label = null!;

    private _scale = 1;
    public get scale() { return this._scale }

    private _maxBlood = 10;
    private _blood = 10;
    public get blood() { return this._blood }

    private setBlood(blood: number) {
        if (blood < 0) blood = 0;
        this._blood = blood;
        this.display.string = `${blood}`;

        // [-0.7, 1]
        const pos = this.getComponent(PositionComponent)
        pos?.set3f(
            pos.x,
            (this._blood / this._maxBlood) * 1.7 - 0.7,
            pos.z
        )
    }

    init(blood: number, maxBlood: number, color: number, scale: number) {
        this._scale = scale;
        this._maxBlood = maxBlood;
        this.setBlood(blood);
        this.face.setScale(scale, 1, scale);
        this.face.getComponent(MeshRenderer)?.setMaterial(this.materials[color], 0);
    }

    subBlood(num: number) {
        this.setBlood(this._blood - num);
    }
}