
import { _decorator, Component, Node, js, Vec3 } from 'cc';
import EcsSystem from '../../ecs/EcsSystem';
import PositionComponent from '../ecs-components/PositionComponent';
import VelocityComponent from '../ecs-components/VelocityComponent';
import math from '../tools/math';

export class MoveSystem extends EcsSystem {
    private moveType = [VelocityComponent, PositionComponent]

    ecsExcute(deltaTime: number) {
        const entitys = this.ecs.getEntitys(this.moveType);

        for (let index = 0; index < entitys.length; index++) {
            const entity = entitys[index];
            const com = entity.getComponent(VelocityComponent)!;
            const pos = entity.getComponent(PositionComponent)!;

            pos.add3f(
                com.velocity.x * deltaTime,
                com.velocity.y * deltaTime,
                com.velocity.z * deltaTime
            )
        }
    }

    ecsUpdate(deltaTime: number) {
        const entitys = this.ecs.getEntitys(this.moveType);

        for (let index = 0; index < entitys.length; index++) {
            const entity = entitys[index];
            const com = entity.getComponent(VelocityComponent)!;

            const pos = entity.node!.position.add3f(
                com.velocity.x * deltaTime,
                com.velocity.y * deltaTime,
                com.velocity.z * deltaTime
            )
            pos.x = math.decimal.toFixed(pos.x, 4);
            pos.y = math.decimal.toFixed(pos.y, 4);
            pos.z = math.decimal.toFixed(pos.z, 4);
            entity.node?.setPosition(pos);
        }
    }
}

if (!CC_EDITOR) {
    js.setClassName('MoveSystem', MoveSystem);
    new MoveSystem(40);
}