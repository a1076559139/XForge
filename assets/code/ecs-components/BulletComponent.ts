

import { _decorator, Component, Node, Material, MeshRenderer } from 'cc';
import EcsComponent from '../../ecs/EcsComponent';
const { ccclass, property } = _decorator;

@ccclass('BulletComponent')
export default class BulletComponent extends EcsComponent {
    @property([Material])
    private materials: Material[] = [];

    @property(Node)
    private face: Node = null!;

    public get scale() { return this.node.scale.x; }

    private _extraAttack = 0;
    private _attack = 1;
    public get attack() { return this._attack + this._extraAttack }

    private _blood = 3;
    public get blood() { return this._blood }

    private setBlood(blood: number) {
        if (blood < 0) blood = 0;
        this._blood = blood;
    }

    private setAttack(attack: number) {
        if (attack < 1) attack = 1;
        this._attack = attack;
    }

    init(blood: number, self = false, attack = 1) {
        this.setBlood(blood);
        this.setAttack(attack);
        this.resetAttack();
        this.face.getComponent(MeshRenderer)?.setMaterial(this.materials[self ? 1 : 0], 0);
    }

    subBlood(num: number) {
        this.setBlood(this._blood - num);
    }

    addAttack(attack: number) {
        this._extraAttack += attack;
    }

    resetAttack() {
        this._extraAttack = 0;
    }
}