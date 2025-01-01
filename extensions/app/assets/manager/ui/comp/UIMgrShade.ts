import { Camera, Color, Component, Director, Material, RenderTexture, Sprite, SpriteFrame, UIOpacity, UITransform, _decorator, director } from 'cc';
import Core from '../../../Core';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('UIMgrShade')
@requireComponent(Sprite)
@requireComponent(UIOpacity)
export default class UIMgrShade extends Component {
    @property(Material)
    private blurMaterial: Material = null;

    @property(SpriteFrame)
    private shadeFrame: SpriteFrame = null;

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

    private get sprite() {
        return this.node.getComponent(Sprite);
    }
    private get opacity() {
        return this.node.getComponent(UIOpacity);
    }

    private inited = false;
    private drawing = false;
    private timedown = 0;

    private blurFrame: SpriteFrame = null;

    init(delay: number, begin: number, end: number, speed: number, blur: boolean) {
        if (blur) {
            director.targetOff(this);
            this.inited = false;
            this.drawing = false;

            this.sprite.color = Color.WHITE;
            this.sprite.customMaterial = null;
            this.sprite.spriteFrame = this.blurFrame;
            if (this.blurFrame) this.blurFrame.flipUVY = false;

            let count = 0;
            const cameras = director.getScene().getComponentsInChildren(Camera);
            director.on(Director.EVENT_BEFORE_RENDER, () => {
                count++;

                const renderTexture = new RenderTexture();
                const size = this.node.getComponent(UITransform);
                renderTexture.reset({ width: size.width / 2, height: size.height / 2 });
                renderTexture.addRef();

                Core.inst.manager.ui.screenshot(renderTexture, {
                    cameraList: cameras
                });

                if (count === 1) {
                    this.blurFrame = new SpriteFrame();
                    this.blurFrame?.texture?.decRef();
                    this.blurFrame.texture = renderTexture;
                    this.blurFrame.flipUVY = true;
                    this.sprite.spriteFrame = this.blurFrame;
                    this.sprite.customMaterial = this.blurMaterial;
                    this.blurMaterial.setProperty('blurLevel', 2);
                    return;
                }

                if (count === 5) {
                    director.targetOff(this);
                    this.sprite.spriteFrame.flipUVY = false;
                    this.sprite.customMaterial = null;
                    return;
                }

                this.blurFrame?.texture?.decRef();
                this.blurFrame.texture = renderTexture;
                this.blurFrame.flipUVY = true;
                this.sprite.spriteFrame = this.blurFrame;
                this.sprite.customMaterial = this.blurMaterial;
                this.blurMaterial.setProperty('blurLevel', count === 2 ? 3 : 1);
            }, this);
        } else {
            director.targetOff(this);
            this.sprite.spriteFrame = this.shadeFrame;
            this.sprite.color = Color.BLACK;
            this.sprite.customMaterial = null;
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
        this.opacity.opacity = this.timedown > 0 ? 0 : this.begin;
    }

    clear() {
        this.inited = false;
        this.drawing = false;
        director.targetOff(this);
        this.blurFrame?.texture?.decRef();
        this.blurFrame?.destroy();
        this.blurFrame = null;
        this.sprite.spriteFrame = null;
    }

    protected update(dt: number) {
        if (!this.inited) return;
        if (!this.drawing) return;

        if (this.timedown > 0) {
            this.timedown -= dt;
            if (this.timedown > 0) return;
            // 初始透明度
            this.opacity.opacity = this.begin;
        }

        const uiOpacity = this.opacity;
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
