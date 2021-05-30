
import { _decorator, Component, Node, Vec3, Tween, tween } from 'cc';
import EcsComponent from '../../ecs/EcsComponent';
import math from '../tools/math';
const { ccclass, property } = _decorator;

@ccclass('PositionComponent')
export default class PositionComponent extends EcsComponent {
    private currPos: Vec3 | null = null;
    private lastPos: Vec3 = new Vec3(0, 0, 0);
    private action: Tween<Node> | null = null;

    onLoad() {
        if (this.currPos === null) this.currPos = this.node.position.clone();
    }

    set3f(x: number, y: number, z: number, updateNode = true, updateTime = 0) {
        if (this.currPos === null) this.currPos = new Vec3(this.x, this.y, this.z);

        this.currPos.x = math.decimal.toFixed(x, 4);
        this.currPos.y = math.decimal.toFixed(y, 4);
        this.currPos.z = math.decimal.toFixed(z, 4);

        if (this.action) {
            this.action.stop();
            this.action = null;
            this.node.setPosition(this.lastPos);
        }
        if (updateNode) {
            if (updateTime <= 0) {
                this.node.setPosition(this.currPos);
            } else {
                this.action = tween(this.node).to(updateTime, { position: this.currPos }).start();
            }
        }

        this.lastPos.set(this.currPos);
    }

    add3f(x: number, y: number, z: number, updateNode = true) {
        this.set3f(
            this.x + x,
            this.y + y,
            this.z + z,
            updateNode
        )
    }

    set(position: Vec3, updateNode = true) {
        this.set3f(
            position.x,
            position.y,
            position.z,
            updateNode
        )
    }

    add(add: Vec3, updateNode = true) {
        this.add3f(add.x, add.y, add.z, updateNode);
    }

    private tempPos: Vec3 = new Vec3();
    get position() {
        this.tempPos.x = this.x;
        this.tempPos.y = this.y;
        this.tempPos.z = this.z;
        return this.tempPos;
    }

    get x() {
        return this.currPos ? this.currPos.x : this.node.position.x;
    }

    get y() {
        return this.currPos ? this.currPos.y : this.node.position.y;
    }

    get z() {
        return this.currPos ? this.currPos.z : this.node.position.z;
    }
}