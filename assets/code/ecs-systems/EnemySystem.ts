
import { _decorator, Component, Node, js } from 'cc';
import EcsSystem from '../../ecs/EcsSystem';
import EnemyComponent from '../ecs-components/EnemyComponent';
import PositionComponent from '../ecs-components/PositionComponent';
import { EnemyManager } from '../managers/game/EnemyManager';

export class EnemySystem extends EcsSystem {
    private count = 1;
    private interval = 1;
    private createEnemy() {
        this.count += 1;
        if (this.count < this.interval) return;
        this.count = 0;

        this.interval = EnemyManager.instance!.create() * 60 + 120;
    }

    ecsExcute() {
        this.createEnemy();

        this.ecs.getEntitys(EnemyComponent).forEach((entity) => {
            const position = entity.getComponent(PositionComponent)!;
            if (position.z >= -2) {
                EnemyManager.instance?.recovery(entity.node!);
            } else {
                const enemy = entity.getComponent(EnemyComponent)!;
                if (enemy.blood === 0) {
                    EnemyManager.instance?.recovery(entity.node!);
                }
            }
        })
    }
}
if (!CC_EDITOR) {
    js.setClassName('EnemySystem', EnemySystem);
    new EnemySystem(20);
}