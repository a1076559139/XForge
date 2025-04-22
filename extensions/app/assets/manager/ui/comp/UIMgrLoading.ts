import { Component, Graphics, Node, Size, UITransform, _decorator } from 'cc';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('UIMgrLoading')
@requireComponent(UITransform)
export default class UIMgrLoading extends Component {
    @property(Node)
    private loading: Node;

    @property({ tooltip: '动画的尺寸' })
    private size: Size = new Size(60, 60);

    @property({ tooltip: '等待几秒后开始动画' })
    private delay = 0;

    private progress = 0;
    private ringScale = 1;
    private reverse = false;

    private angleSpeed = 120;
    private ringSpeed = 0.02;

    private inited = false;
    private drawing = false;
    private timedown = 0;

    init() {
        if (this.inited) return;
        this.inited = true;

        this.progress = 0;
        this.ringScale = 1;
        this.loading.angle = 0;
        this.reverse = false;

        this.drawing = false;
        this.timedown = this.delay;
        this.loading.getComponent(Graphics).clear();
    }

    clear() {
        this.inited = false;
        this.drawing = false;
    }

    /**
     * 需要重写
     */
    private onDraw() {
        const graphics = this.loading.getComponent(Graphics);
        const uiTransform = this.loading.getComponent(UITransform);

        const centerX = this.size.width * (0.5 - uiTransform.anchorX);
        const centerY = this.size.height * (0.5 - uiTransform.anchorY);

        const r = Math.min(this.size.width / 2, this.size.height / 2);

        const allPI = Math.PI;
        const offst = 0;

        graphics.clear();
        if (this.reverse) {
            const start = 0.5 * Math.PI + offst;
            const end = 0.5 * Math.PI + this.progress * 2 * allPI + offst;
            graphics.arc(centerX, centerY, r, start, end, true);
        } else {
            const start = 0.5 * Math.PI - offst;
            const end = 0.5 * Math.PI - this.progress * 2 * allPI - offst;
            graphics.arc(centerX, centerY, r, start, end, false);
        }
        graphics.stroke();
    }

    protected update(dt: number): void {
        if (!this.inited) return;

        // 倒计时
        if (!this.drawing) {
            if (this.timedown > 0) {
                this.timedown -= dt;
            }
            if (this.timedown <= 0) {
                this.drawing = true;
            } else {
                return;
            }
        }

        // 旋转
        this.loading.angle -= this.angleSpeed * dt;
        if (this.loading.angle >= 360 || this.loading.angle <= -360) {
            this.loading.angle = this.loading.angle % 360;
        }

        // 进度
        if (this.ringScale > 0) {
            this.progress = Math.min(1, this.progress + this.ringSpeed * this.ringScale);

            if (this.progress == 1) {
                this.ringScale = -1;
                this.reverse = !this.reverse;
            }
        } else {
            this.progress = Math.max(0, this.progress + this.ringSpeed * this.ringScale);

            if (this.progress == 0) {
                this.ringScale = 1;
                this.reverse = !this.reverse;
            }
        }

        this.onDraw();
    }
}
