
import { _decorator, Component, Node, js, Vec2, Vec3 } from 'cc';
import EcsSystem from '../../ecs/EcsSystem';
import BulletComponent from '../ecs-components/BulletComponent';
import ColliderComponent from '../ecs-components/ColliderComponent';
import EnemyComponent from '../ecs-components/EnemyComponent';
import ObstacleComponent from '../ecs-components/ObstacleComponent';
import PositionComponent from '../ecs-components/PositionComponent';
import VelocityComponent from '../ecs-components/VelocityComponent';
import { LaserEffectManager } from '../managers/effect/LaserEffectManager';
import { LightningEffectManager } from '../managers/effect/LightningEffectManager';
import math from '../tools/math';

/**
 * 
 * @param direction 入射向量(需要已归一化)
 * @param normal    法线向量(需要已归一化)
 * @returns 
 */
let reflect: Vec2 = new Vec2(0, 0);
function Vec2Reflect(I: Vec2, N: Vec2): Vec2 {
    // 反射向量 R = I-2*(I·N)*N
    reflect.x = N.x * 2 + I.x;
    reflect.y = N.y * 2 + I.y;

    return reflect;
}

export class CollisionSystem extends EcsSystem {
    private bulletsType = [BulletComponent, ColliderComponent, VelocityComponent, PositionComponent];
    private obstaclesType = [ObstacleComponent, PositionComponent];

    ecsExcute() {
        // 子弹
        const bullets = this.ecs.getEntitys(this.bulletsType);
        // 障碍物（敌人和墙）
        const obstacles = this.ecs.getEntitys(this.obstaclesType);

        for (let i = 0; i < bullets.length; i++) {
            const bulletEntity = bullets[i];
            const bullet = bulletEntity.getComponent(BulletComponent)!;
            const collider = bulletEntity.getComponent(ColliderComponent)!;
            const velocity = bulletEntity.getComponent(VelocityComponent)!;
            const position = bulletEntity.getComponent(PositionComponent)!;

            for (let j = 0; j < obstacles.length; j++) {
                const obstacleEntity = obstacles[j];

                // 判断是否是首次相交
                if (collider.colliding === obstacleEntity.uuid) continue;

                const obstacle = obstacleEntity.getComponent(ObstacleComponent)!;
                const obstaclePos = obstacleEntity.getComponent(PositionComponent)!;

                // 判断是否相交
                if (obstacle.isWall) {
                    if (obstaclePos.x > 0) {
                        // if (position.x + bullet.node!.scale.x / 2 < obstaclePos.x) continue;
                        if (math.decimal.toFixed(position.x + bullet.scale / 2, 4) < obstaclePos.x) continue;
                    } else {
                        // if (position.x - bullet.node!.scale.x / 2 > obstaclePos.x) continue;
                        if (math.decimal.toFixed(position.x - bullet.scale / 2, 4) > obstaclePos.x) continue;
                    }
                } else {
                    const enemy = obstacleEntity.getComponent(EnemyComponent)!;

                    // 是否相交
                    const r = enemy.scale / 2 + bullet.scale / 2;
                    const a = position.x - obstaclePos.x
                    const b = position.z - obstaclePos.z;
                    // if (a * a + b * b > r * r) continue;

                    if (math.decimal.toFixed(a * a + b * b, 4) > math.decimal.toFixed(r * r, 4)) continue;
                }

                // 标记是否首次相交
                collider.colliding = obstacleEntity.uuid;

                // 计算反射向量
                if (obstacle.isWall) {
                    if (obstaclePos.x > 0) {
                        velocity.setDirection(-Math.abs(velocity.direction.x), velocity.direction.y, velocity.direction.z);
                    } else {
                        velocity.setDirection(Math.abs(velocity.direction.x), velocity.direction.y, velocity.direction.z);
                    }
                } else {
                    const R = Vec2Reflect(
                        new Vec2(velocity.direction.x, velocity.direction.z),
                        new Vec2(position.x - obstaclePos.x, position.z - obstaclePos.z).normalize(),
                    )
                    velocity.setDirection(R.x, 0, R.y);
                }

                // 减少血量
                bullet.subBlood(1);
                if (!obstacle.isWall) {
                    const enemy = obstacleEntity.getComponent(EnemyComponent)!;
                    enemy.subBlood(bullet.attack);

                    math.random.get() > 0.95 &&
                        LightningEffectManager.instance?.createEffect(obstaclePos.position);
                    math.random.get() < 0.05 &&
                        LaserEffectManager.instance?.createEffect(obstaclePos.position);
                }
            }
        }
    }
}

if (!CC_EDITOR) {
    js.setClassName('CollisionSystem', CollisionSystem);
    new CollisionSystem(0);
}