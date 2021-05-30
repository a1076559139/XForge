
import { _decorator, Component, Node } from 'cc';
import ecs from '../../ecs/ecs';
import { ServerManager, IFrame, IFrameMode, FrameMode } from './ServerManager';
const { ccclass, property } = _decorator;

let instance: EcsManager | null = null;

@ccclass('EcsManager')
export class EcsManager extends Component {
    static get instance() { return instance; }
    onLoad() { instance = this; }

    private currFrame: any = null;
    private currMode: IFrameMode = FrameMode.Normal;
    private renderIndex = 3;
    private renderCount = 3;
    private frameDts = [0.017, 0.017, 0.017];

    get handleIndex() { return this.renderIndex; }
    get isFree() { return this.renderIndex === this.renderCount; }

    private renderDt = 0;

    start() {
        ServerManager.instance?.node.once('init', function (this: EcsManager, roleid: string) {
            this.currFrame = null;
            this.currMode = FrameMode.Normal;
            this.renderIndex = 3;
            this.renderCount = 3;
            this.renderDt = 0;
        }, this);
    }

    // 处理帧数据,将20帧扩展至60帧
    handleFrame(frame: IFrame, mode: IFrameMode, excuteIndex = 0) {
        while (this.renderIndex < this.renderCount) {
            if (this.currMode === FrameMode.Normal) {
                ecs.excute(this.frameDts[this.renderIndex++], this.currFrame, this.renderIndex, this.renderCount);
            } else {
                ecs.update(this.frameDts[this.renderIndex++], this.renderIndex, this.renderCount);
            }
        }

        this.currMode = mode;
        this.currFrame = frame;
        this.renderIndex = 0;

        if (excuteIndex > this.renderCount) excuteIndex = this.renderCount;
        while (this.renderIndex < excuteIndex) {
            this.renderFrame();
        }
    }

    private renderFrame() {
        if (this.renderIndex >= this.renderCount) return;
        if (this.currMode === FrameMode.Normal) {
            ecs.excute(this.frameDts[this.renderIndex++], this.currFrame, this.renderIndex, this.renderCount);
        } else {
            ecs.update(this.frameDts[this.renderIndex++], this.renderIndex, this.renderCount);
        }
    }

    update(dt: number) {
        if (this.renderIndex >= this.renderCount) return;
        this.renderDt += dt;
        if (this.renderDt < 0.017) return;

        while (this.renderDt >= 0.017) {
            this.renderDt -= 0.017;
            this.renderFrame();
        }
    }
}