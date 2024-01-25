import { Component, UIOpacity, _decorator } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('UIMgrShade')
@requireComponent(UIOpacity)
export default class UIMgrShade extends Component {
    @property
    private _delay = 0;
    @property
    get delay() { return this._delay; }
    set delay(v) { this._delay = Math.max(v, 0); }

    @property
    private _begin = 0;
    @property
    get begin() { return this._begin; }
    set begin(v) { if (v >= 0 && v <= 255) this._begin = v; }

    @property
    private _end = 255;
    @property
    get end() { return this._end; }
    set end(v) { if (v >= 0 && v <= 255) this._end = v; }

    @property
    private _speed = 10;
    @property
    get speed() {
        if (this.begin == this.end) {
            return 0;
        } else if (this.begin > this.end) {
            return this._speed > 0 ? -this._speed : this._speed;
        } else {
            return this._speed >= 0 ? this._speed : -this._speed;
        }
    }
    set speed(v) { this._speed = v; }

    private stopAnimation = true;

    init(delay: number, begin: number, end: number, speed: number) {
        this.delay = delay;
        this.begin = begin;
        this.end = end;
        this.speed = speed;
        this.stopAnimation = false;
    }

    protected onEnable() {
        if (this.delay <= 0) {
            this.stopAnimation = false;
            this.node.getComponent(UIOpacity).opacity = this.begin;
        } else {
            this.stopAnimation = true;
            this.node.getComponent(UIOpacity).opacity = 0;
            this.scheduleOnce(() => {
                this.node.getComponent(UIOpacity).opacity = this.begin;
                this.stopAnimation = false;
            }, this.delay);
        }
    }

    protected onDisable() {
        this.unscheduleAllCallbacks();
    }

    protected update(dt: number) {
        if (this.stopAnimation) return;
        const uiOpacity = this.node.getComponent(UIOpacity);
        if (this.speed > 0) {
            uiOpacity.opacity += this.speed * dt;
            if (uiOpacity.opacity > this.end) {
                uiOpacity.opacity = this.end;
            }
        } else if (this.speed < 0) {
            uiOpacity.opacity += this.speed * dt;
            if (uiOpacity.opacity < this.end) {
                uiOpacity.opacity = this.end;
            }
        }
        if (uiOpacity.opacity == this.end) {
            this.stopAnimation = true;
        }
    }
}
