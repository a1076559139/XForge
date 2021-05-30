
import { _decorator, Component, Node, CCBoolean } from 'cc';
import EcsComponent from '../../ecs/EcsComponent';
const { ccclass, property } = _decorator;

@ccclass('ColliderComponent')
export default class ColliderComponent extends EcsComponent {
    colliding: string = '';

    protected onAwake() {
        this.colliding = '';
    }
}