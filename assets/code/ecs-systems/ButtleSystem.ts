
import { _decorator, Component, Node, js } from 'cc';
import EcsSystem from '../../ecs/EcsSystem';
import BulletComponent from '../ecs-components/BulletComponent';
import PositionComponent from '../ecs-components/PositionComponent';
import { ButtleManager } from '../managers/game/ButtleManager';
const { ccclass, property } = _decorator;

export class ButtleSystem extends EcsSystem {
    ecsExcute() {
        this.ecs.getEntitys(BulletComponent).forEach((entity) => {
            const position = entity.getComponent(PositionComponent)!;
            if (position.z >= 2 || position.z < -30) {
                ButtleManager.instance?.recovery(entity.node!);
            } else {
                const buttle = entity.getComponent(BulletComponent)!;
                if (buttle.blood === 0) {
                    ButtleManager.instance?.recovery(buttle.node!);
                }
            }
        })
    }
}
if (!CC_EDITOR) {
    js.setClassName('ButtleSystem', ButtleSystem);
    new ButtleSystem(10);
}