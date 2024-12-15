import { Camera, Color, Component, Director, Material, RenderTexture, Sprite, SpriteFrame, UIOpacity, UITransform, _decorator, director } from 'cc';
import Core from '../../../Core';
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

    private inited = false;
    private drawing = false;
    private timedown = 0;

    private normalFrame: SpriteFrame = null;

    private blurMaterial: Material = null;
    private blurFrame = new SpriteFrame();

    protected onLoad(): void {
        this.normalFrame = this.node.getComponent(Sprite).spriteFrame;
        this.blurMaterial = this.node.getComponent(Sprite).customMaterial;
    }

    init(delay: number, begin: number, end: number, speed: number, blur: boolean) {
        if (blur) {
            this.node.getComponent(Sprite).color = Color.WHITE;
            this.node.getComponent(Sprite).spriteFrame = null;
            this.node.getComponent(Sprite).customMaterial = this.blurMaterial;

            const cameras = director.getScene().getComponentsInChildren(Camera);

            let count = 0;
            director.targetOff(this);
            director.on(Director.EVENT_BEFORE_RENDER, () => {
                const renderTexture = new RenderTexture();
                const size = this.node.getComponent(UITransform);
                renderTexture.reset({ width: size.width / 2, height: size.height / 2 });
                renderTexture.addRef();

                Core.inst.manager.ui.screenshot(renderTexture, {
                    cameraList: cameras
                });

                this.blurFrame?.texture?.decRef();
                this.blurFrame.texture = renderTexture;
                this.blurFrame.flipUVY = true;
                this.node.getComponent(Sprite).spriteFrame = this.blurFrame;
                this.blurMaterial.setProperty('blurLevel', count === 0 ? 3 : 1);

                if (count++ === 2) {
                    director.targetOff(this);
                    this.node.getComponent(Sprite).spriteFrame.flipUVY = false;
                    this.node.getComponent(Sprite).customMaterial = null;
                }
            }, this);
        } else {
            director.targetOff(this);
            this.node.getComponent(Sprite).spriteFrame = this.normalFrame;
            this.node.getComponent(Sprite).color = Color.BLACK;
            this.node.getComponent(Sprite).customMaterial = null;
        }

        this.delay = delay;
        this.begin = begin;
        this.end = end;
        this.speed = speed;
        this.drawing = true;

        if (this.inited) return;
        this.inited = true;
        this.timedown = this.delay;
        // 初始透明度
        this.node.getComponent(UIOpacity).opacity = this.timedown > 0 ? 0 : this.begin;
    }

    clear() {
        this.inited = false;
        this.drawing = false;
        director.targetOff(this);
    }

    protected update(dt: number) {
        if (!this.inited) return;
        if (!this.drawing) return;

        if (this.timedown > 0) {
            this.timedown -= dt;
            if (this.timedown > 0) return;
            // 初始透明度
            this.node.getComponent(UIOpacity).opacity = this.begin;
        }

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
            this.drawing = false;
        }
    }
}
