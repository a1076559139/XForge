
import { _decorator, Component, Node, Camera, geometry, systemEvent, SystemEventType, EventTouch, Touch, PhysicsSystem, Collider, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('TouchMove3D')
export class TouchMove3D extends Component {
    @property(Camera)
    protected camera: Camera = null!;

    // 射线
    private _ray: geometry.Ray = new geometry.Ray();
    private _pos: Vec3 = new Vec3();

    onEnable() {
        systemEvent.on(SystemEventType.TOUCH_START, this.onTouchStart, this);
        systemEvent.on(SystemEventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    onDisable() {
        systemEvent.off(SystemEventType.TOUCH_START, this.onTouchStart, this);
        systemEvent.off(SystemEventType.TOUCH_MOVE, this.onTouchMove, this);
    }

    onTouchStart(touch: Touch, event: EventTouch) {
        this.onTouchMove(touch, event);
    }

    onTouchMove(touch: Touch, event: EventTouch) {
        this.camera.screenPointToRay(touch.getLocationX(), touch.getLocationY(), this._ray);

        //基于物理碰撞器的射线检测
        if (PhysicsSystem.instance.raycastClosest(this._ray)) {
            const result = PhysicsSystem.instance.raycastClosestResult;
            if (result?.collider?.node?.uuid !== this.node.uuid) return;

            this._pos.x = result.hitPoint.x;
            this._pos.y = this.node.position.y;
            this._pos.z = this.node.position.z;

            this.node.setPosition(this._pos);
        }
    }
}