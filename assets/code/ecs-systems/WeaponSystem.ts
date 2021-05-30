
import { _decorator, Component, Node, js } from 'cc';
import EcsSystem from '../../ecs/EcsSystem';
import PositionComponent from '../ecs-components/PositionComponent';
import WeaponComponent from '../ecs-components/WeaponComponent';
import { ButtleManager } from '../managers/game/ButtleManager';
import { IFrame } from '../managers/ServerManager';
import roleData from '../models/roleData';

export class WeaponSystem extends EcsSystem {
    private count = 0;
    createButtle() {
        this.count += 1;
        if (this.count < 6) return;
        this.count = 0;

        this.ecs.getEntitys(WeaponComponent).forEach(function (entity) {
            ButtleManager.instance?.create(entity.node!, 3);
        })
    }

    ecsExcute(deltaTime: number, frame: IFrame, index: number, max: number) {
        index === 1 && frame && this.ecs.getEntitys(WeaponComponent).forEach(function (entity) {
            const weapon = entity.getComponent(WeaponComponent)!;
            const x = frame[weapon.roleid];
            if (x) {
                const pos = entity.getComponent(PositionComponent)!;
                pos.set3f(-3.6 + x * 0.1, pos.y, pos.z, weapon.roleid !== roleData.roleid, 0.05);
            }
        })

        this.createButtle();
    }
}
if (!CC_EDITOR) {
    js.setClassName('WeaponSystem', WeaponSystem);
    new WeaponSystem(9);
}