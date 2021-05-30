
import { _decorator, Component, Node, Vec3 } from 'cc';
import EcsComponent from '../../ecs/EcsComponent';
import math from '../tools/math';
const { ccclass, property } = _decorator;

@ccclass('VelocityComponent')
export default class VelocityComponent extends EcsComponent {
    // 速度
    private _speed = 1;
    // 方向
    private _direction: Vec3 = new Vec3(0, 0, -1);
    // 速度倍率
    private _speedScale = 1;

    get speedScale(): number {
        return this._speedScale;
    }

    private _tempVelocity: Vec3 = new Vec3(0, 0, 0);
    get velocity(): Vec3 {
        this._tempVelocity.set(this._direction);
        this._tempVelocity.normalize();
        this._tempVelocity.multiplyScalar(this._speed * this._speedScale);

        // 消除平台误差
        this._tempVelocity.x = math.decimal.toFixed(this._tempVelocity.x, 4);
        this._tempVelocity.y = math.decimal.toFixed(this._tempVelocity.y, 4);
        this._tempVelocity.z = math.decimal.toFixed(this._tempVelocity.z, 4);

        return this._tempVelocity;
    }

    private _tempDirection: Vec3 = new Vec3(0, 0, 0);
    get direction(): Vec3 {
        this._tempDirection.set(this._direction);
        return this._tempDirection;
    }

    init(x: number = 0, y: number = 0, z: number = -1, speed: number = 1, speedScale: number = 1) {
        this.setDirection(x, y, z);
        this.setSpeed(speed);
        this.setSpeedScale(speedScale);
    }

    setDirection(x: number, y: number, z: number) {
        this._direction.x = x;
        this._direction.y = y;
        this._direction.z = z;
        this._direction.normalize();

        // 消除平台误差
        this._direction.x = math.decimal.toFixed(this._direction.x, 4);
        this._direction.y = math.decimal.toFixed(this._direction.y, 4);
        this._direction.z = math.decimal.toFixed(this._direction.z, 4);
    }

    setSpeed(speed: number) {
        this._speed = speed;
    }

    setSpeedScale(scale: number) {
        this._speedScale = scale;
    }
}