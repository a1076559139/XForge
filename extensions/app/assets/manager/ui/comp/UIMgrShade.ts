import { Camera, Color, Component, Director, Material, RenderTexture, Sprite, SpriteFrame, UIOpacity, _decorator, director, view } from 'cc';
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

    private blurMaterial: Material = null;
    private normalFrame: SpriteFrame = null;

    protected onLoad(): void {
        this.normalFrame = this.node.getComponent(Sprite).spriteFrame;
        this.blurMaterial = this.node.getComponent(Sprite).customMaterial;
    }

    init(delay: number, begin: number, end: number, speed: number, blur: boolean) {
        if (blur) {
            this.node.getComponent(Sprite).color = Color.WHITE;
            this.node.getComponent(Sprite).spriteFrame = null;
            this.node.getComponent(Sprite).customMaterial = this.blurMaterial;

            const cameraList = director.getScene().getComponentsInChildren(Camera)
                .sort((a, b) => a.priority - b.priority)
                .filter(camera => {
                    if (!camera.enabledInHierarchy) return false;
                    if (camera.targetTexture) return false;
                    return true;
                });
            const cameraList2 = cameraList.map(camera => camera.camera);

            let count = 0;
            director.targetOff(this);
            director.on(Director.EVENT_BEFORE_RENDER, () => {
                const size = view.getVisibleSize();
                const renderTexture = new RenderTexture();
                renderTexture.reset({ width: size.width / 2, height: size.height / 2 });

                cameraList.forEach(camera => {
                    camera.targetTexture = renderTexture;
                });
                director.root.pipeline.render(cameraList2);
                cameraList.forEach(camera => {
                    camera.targetTexture = null;
                });

                const spriteFrame = new SpriteFrame();
                spriteFrame.texture = renderTexture;
                spriteFrame.flipUVY = true;
                this.node.getComponent(Sprite).spriteFrame = spriteFrame;

                if (count++ === 2) {
                    this.node.getComponent(Sprite).spriteFrame.flipUVY = false;
                    this.node.getComponent(Sprite).customMaterial = null;
                    director.targetOff(this);
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
