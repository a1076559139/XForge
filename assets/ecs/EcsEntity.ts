import * as cc from "cc"
import EcsComponent from "./EcsComponent";

export default class EcsEntity {
    private flag: [number, number] = [0, 0];
    private components: Map<string, EcsComponent> = new Map();

    // uuid(仅第一次赋值有效)
    private _uuid = '';
    public set uuid(value: string) {
        if (this._uuid === '') this._uuid = value;
    }
    public get uuid() {
        return this._uuid;
    }

    // 对应的节点
    private _node: cc.Node | null = null;
    public get node() {
        return this._node;
    }

    addComponent(com: EcsComponent, flag: [number, number]) {
        const componentName = cc.js.getClassName(com);

        if (com.node?.uuid !== this._uuid) {
            throw new Error(componentName + '不属于当前EcsEntity');
        }

        if (this.components.has(componentName)) {
            throw new Error('不能重复添加相同类型的EcsComponent');
        }
        // this.flag[0] = this.flag[0] | flag[0];
        // this.flag[1] = this.flag[1] | flag[1];

        // 改进
        this.flag[0] |= flag[0];
        this.flag[1] |= flag[1];

        this.components.set(componentName, com);

        this._node = com.node;
    }

    removeComponent(com: EcsComponent, flag: [number, number]) {
        const componentName = cc.js.getClassName(com);

        if (com.node?.uuid !== this._uuid) {
            console.info(componentName + '不属于当前EcsEntity');
        }

        if (this.components.delete(componentName)) {
            // this.flag[0] = this.flag[0] ^ flag[0];
            // this.flag[1] = this.flag[1] ^ flag[1];

            // 改进
            // this.flag[0] ^= flag[0];
            // this.flag[1] ^= flag[1];

            // 改进
            this.flag[0] &= ~flag[0];
            this.flag[1] &= ~flag[1];
        }

        if (this.components.size === 0) {
            this._node = null;
        }
    }

    getComponent<T extends EcsComponent>(type: (new () => T)): T | null {
        const componentName = cc.js.getClassName(type);
        return <T>this.components.get(componentName) || null;
    }

    hasComponent<T extends EcsComponent>(type: (new () => T)): boolean {
        const componentName = cc.js.getClassName(type);
        return !!this.components.get(componentName);
    }

    eachComponent(callback: (value: EcsComponent) => void) {
        this.components.forEach(callback);
    }

    size() {
        return this.components.size;
    }

    check(flag: [number, number]) {
        if ((this.flag[0] || flag[0]) && (this.flag[1] || flag[1])) {
            return (this.flag[0] & flag[0]) === flag[0] && (this.flag[1] & flag[1]) === flag[1];
        } else if (this.flag[1] || flag[1]) {
            return (this.flag[1] & flag[1]) === flag[1];
        } else {
            return (this.flag[0] & flag[0]) === flag[0];
        }
    }

    clear() {
        this._uuid = '';
        this._node = null;
        this.flag[0] = 0;
        this.flag[1] = 0;
        this.components.clear();
    }
}
