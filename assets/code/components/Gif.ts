
import { _decorator, Component, Node, SpriteFrame, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Gif')
export class Gif extends Component {
    @property(Node)
    target: Node = null!;

    @property([SpriteFrame])
    frames: SpriteFrame[] = [];

    @property
    interval = 0.016;

    @property
    loop = false;

    @property
    playAwake = false;

    private _time = 0;
    private _index = 0;
    private _running = false;

    get running() {
        return this._running;
    }

    start() {
        this.playAwake && this.play();
    }

    play() {
        this._time = 0;
        this._index = 0;
        this._running = true;
    }

    pause() {
        this._running = false;
    }

    resume() {
        this._running = true;
    }

    stop() {
        this._running = false;
    }

    update(dt: number) {
        if (!this._running) return;
        if (this._index >= this.frames.length) return this.stop();

        this._time += dt;
        if (this._time < this.interval) return;
        this._time -= this.interval;

        const node = this.target || this.node;
        node.getComponent(Sprite)!.spriteFrame = this.frames[this._index++];

        if (this._index < this.frames.length) return;

        if (this.loop) {
            this.play();
        } else {
            this.stop();
        }
    }
}

/**
 * [1] Class member could be defined like this.
 * [2] Use `property` decorator if your want the member to be serializable.
 * [3] Your initialization goes here.
 * [4] Your update function goes here.
 *
 * Learn more about scripting: https://docs.cocos.com/creator/3.0/manual/en/scripting/
 * Learn more about CCClass: https://docs.cocos.com/creator/3.0/manual/en/scripting/ccclass.html
 * Learn more about life-cycle callbacks: https://docs.cocos.com/creator/3.0/manual/en/scripting/life-cycle-callbacks.html
 */
