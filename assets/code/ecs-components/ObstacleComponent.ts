
import { _decorator, Component, Node, CCBoolean } from 'cc';
import EcsComponent from '../../ecs/EcsComponent';
const { ccclass, property } = _decorator;

@ccclass('ObstacleComponent')
export default class ObstacleComponent extends EcsComponent {
    @property(CCBoolean)
    readonly isWall: boolean = false;
}