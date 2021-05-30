import * as cc from "cc"
import ecs from "./ecs";
import ecsEntity from "./EcsEntity";

const { ccclass, property } = cc._decorator;

@ccclass('EcsComponent')
export default class EcsComponent extends cc.Component {
    /**
     * 指定ecs名字
     */
    private ecsName: string = 'default';
    protected get ecs() {
        return ecs.getECS(this.ecsName);
    }

    protected get entity(): ecsEntity | null {
        return this.ecs.getTargetEntity(this);
    }

    constructor(ecsName?: string)
    constructor(...args: any[]) {
        super();

        const ecsName = args[0];
        this.ecsName = typeof ecsName !== 'string' ? 'default' : (ecsName || 'default');
    }

    protected onEnable() {
        this.ecs.addComponent(this);
        this.onAwake();
    }

    protected onDisable() {
        this.ecs.removeComponent(this);
        this.unAwake();
    }

    protected onAwake() {

    }

    protected unAwake() {

    }

    protected ecsUpdateTimerOn(callback: Function, frameCount = 1, times = 1) {
        this.ecs.updateTimer.on(this, callback, frameCount, times);
    }

    protected ecsExcuteTimerOn(callback: Function, frameCount = 1, times = 1) {
        this.ecs.excuteTimer.on(this, callback, frameCount, times);
    }

    protected ecsUpdateTimerOff(callback: Function) {
        this.ecs.updateTimer.off(callback, this);
    }

    protected ecsExcuteTimerOff(callback: Function) {
        this.ecs.excuteTimer.off(callback, this);
    }

    // 由ecs.excute驱动
    protected ecsExcute(data1?: any, data2?: any, data3?: any, data4?: any, data5?: any) {

    }

    // 由ecs.update驱动
    protected ecsUpdate(data1?: any, data2?: any, data3?: any, data4?: any, data5?: any) {

    }
}
