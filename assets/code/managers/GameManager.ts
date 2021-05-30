

import { _decorator, Component, Node, Camera, Prefab, instantiate, Vec3, systemEvent, SystemEventType, EventTouch, Touch, NodePool, Button, Label, tween, Tween, view, sys } from 'cc';
import { ServerManager } from './ServerManager';
import roleData from '../models/roleData';
import math from '../tools/math';
import { WeaponManager } from './game/WeaponManager';
import { EnemyManager } from './game/EnemyManager';
import { ButtleManager } from './game/ButtleManager';
const { ccclass, property } = _decorator;

let instance: GameManager | null = null;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(Camera)
    protected camera: Camera = null!;

    @property(Node)
    protected delayLayer: Node = null!;

    @property(Node)
    protected ctrBtn: Node = null!;

    protected selfWeapon: Node | null = null;

    static get instance() { return instance; }
    onLoad() { instance = this; }

    start() {
        var a= 99.454541281545445
    for(let i=0; i<10000; i++){
        a = Math.sin(a) + Math.cos(a+i/3.145698444)
    }
    console.log('asdas',a);
        this.ctrBtn.on(Node.EventType.TOUCH_START, this.onClickCtrBtn, this);
        ServerManager.instance?.node.once('init', function (this: GameManager, roleid: string) {
            WeaponManager.instance?.recoveryAll();
            EnemyManager.instance?.recoveryAll();
            ButtleManager.instance?.recoveryAll();

            roleData.roleid = roleid;
            this.delayLayer.active = true;
        }, this);

        ServerManager.instance?.node.once('initRoom', function (this: GameManager, data: [string, string[]]) {
            roleData.roomid = data[0];
            data[1].forEach((roleid) => {
                WeaponManager.instance?.create(roleid);
            })
        }, this)

        ServerManager.instance?.node.on('joinRoom', function (this: GameManager, roleid: string) {
            const node = WeaponManager.instance?.create(roleid, roleid === roleData.roleid)!;
            if (roleid === roleData.roleid) {
                this.selfWeapon = node;
                node.setPosition(node.position.x, node.position.y + 0.1, node.position.z);
                ServerManager.instance?.sendRemoteData('ready');
            }
        }, this)

        ServerManager.instance?.node.once('gameStart', function (this: GameManager, data: number) {
            this.delayLayer.active = false;
            // 设置随机种子
            math.random.setSeed(data);
        }, this)
    }

    private onClickCtrBtn() {
        if (ServerManager.instance?.running) {
            ServerManager.instance?.pause();
            this.ctrBtn.children[0].getComponent(Label)!.string = '恢复';
        } else {
            ServerManager.instance?.resume();
            this.ctrBtn.children[0].getComponent(Label)!.string = '暂停';
        }
    }

    /**
     * 震屏效果
     * 参数：duration 震屏时间
     * @param {*} param0 
     */
    private shakeAction: Tween<Node> | null = null;
    private originalPos: Vec3 = new Vec3(0, 0, 0);
    public shakeEffect({ duration = 1, effectScale = 1, timeScale = 1, finish }: { duration?: number, effectScale?: number, timeScale?: number, finish?: Function } = {}) {
        if (duration <= 0) return;

        const node = this.camera.node;

        if (this.shakeAction) {
            this.shakeAction.stop();
            node.setPosition(this.originalPos);
        }

        const x = node.position.x;
        const y = node.position.y;
        const z = node.position.z;
        this.originalPos.x = x;
        this.originalPos.y = y;
        this.originalPos.z = z;

        const time = 0.02 * timeScale;
        effectScale *= 0.01;

        this.shakeAction = tween(node)
            .sequence(
                tween().to(time, { position: new Vec3(x + 5 * effectScale, y, z + 7 * effectScale) }),
                tween().to(time, { position: new Vec3(x - 6 * effectScale, y, z + 7 * effectScale) }),
                tween().to(time, { position: new Vec3(x - 13 * effectScale, y, z + 3 * effectScale) }),
                tween().to(time, { position: new Vec3(x + 3 * effectScale, y, z - 6 * effectScale) }),
                tween().to(time, { position: new Vec3(x - 5 * effectScale, y, z + 5 * effectScale) }),
                tween().to(time, { position: new Vec3(x + 2 * effectScale, y, z - 8 * effectScale) }),
                tween().to(time, { position: new Vec3(x - 8 * effectScale, y, z - 10 * effectScale) }),
                tween().to(time, { position: new Vec3(x + 3 * effectScale, y, z + 10 * effectScale) })
            )
            .call(() => {
                this.shakeAction = null;
                node.setPosition(x, y, z);
                finish && finish();
            })
            .start()
    }

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
        const size = view.getVisibleSize();
        const x = touch.getUILocationX() - size.width / 2;

        const ratio = size.width / size.height / 0.463;
        let X = size.width / 2 / ratio;

        if (x > X || x < -X) return;

        X = x / X * 3.6;
        this.selfWeapon?.setPosition(new Vec3(
            X,
            this.selfWeapon!.position.y,
            this.selfWeapon!.position.z
        ));

        // 从-3.6开始，每0.1算一档，一共72档
        X = Math.round((X + 3.6) / 0.1);
        ServerManager.instance?.sendToFrame(X);
    }
}