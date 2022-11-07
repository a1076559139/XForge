import { EcsBase, ecsclass } from "./ecs";
import EcsEntity from "./EcsEntity";

let uuidIndex = 0;
function createUUID() {
    if (uuidIndex++ > 10000000) uuidIndex = 0;
    return `Com-${Date.now()}-${uuidIndex}`;
}

@ecsclass('EcsComponent')
export class EcsComponent extends EcsBase {
    /**类名 */
    public get ecsClassName() {
        return (this.constructor as typeof EcsBase).ecsClassName;
    }

    /**
     * 唯一ID
     */
    private _uuid = '';
    public get uuid() {
        return this._uuid;
    }

    /**
     * 是否有效
     */
    private _isValid = false;
    public get isValid() {
        return this._isValid;
    }

    /**
     * 组件的实体
     */
    private _entity: EcsEntity = null;
    public get entity() {
        return this._entity;
    }

    /**
     * 实体绑定的节点
     */
    public get node() {
        if (!this.entity) return null;
        return this.entity.node;
    }

    /**
     * 融合的EcsComponent
     */
    protected mixs: typeof EcsComponent[] = [];
    /**
     * 融合处理
     */
    protected handleMixComponent(com: EcsComponent, index: number) { }

    /**
     * 内部初始化函数
     * @param entity 
     */
    private innerInit(entity: EcsEntity) {
        this._isValid = true;
        this._entity = entity;
        this._uuid = createUUID();
    }

    /**
     * 内部生效函数
     */
    private innerEnable() {
        this.beforeEnable();
        this.onEnable();
    }

    /**
     * 内部失效函数
     */
    private innerDisable() {
        this.onDisable();
        this.afterDisable();
    }

    /**
     * 组件生效之前
     */
    protected beforeEnable() {
        this.mixs.forEach((Component, index) => {
            const com = this.addComponent(Component);
            this.handleMixComponent(com, index)
        });
    }

    /**
     * 组件生效
     */
    protected onEnable() { }

    /**
     * 组件失效
     */
    protected onDisable() { }

    /**
     * 组件失效之后
     */
    protected afterDisable() {
        this.mixs.forEach(Comment => {
            this.removeComponent(Comment);
        });
    }

    /**
     * 销毁
     * @param target 权柄
     */
    public destroy(target?: any) {
        this.entity.removeComponent(this, target);
    }

    public getComponent(className: string): any;
    public getComponent<T extends EcsComponent>(type: { prototype: T }): T;
    public getComponent(type: any) {
        if (!this.entity) return null;
        return this.entity.getComponent(type, this);
    };

    public getComponents(className: string): any[];
    public getComponents<T extends EcsComponent>(type: { prototype: T }): T[];
    public getComponents(type: any) {
        if (!this.entity) return [];
        return this.entity.getComponents(type, [], this);
    };

    public addComponent<T extends typeof EcsComponent>(Com: T | string): InstanceType<T> {
        if (!this.entity) return null;
        return this.entity.addComponent(Com, this);
    }

    public removeComponent<T extends typeof EcsComponent>(Com: T | string): boolean {
        if (!this.entity) return null;
        return this.entity.removeComponent(Com, this);
    };

    protected log(str: any, ...args: any[]) {
        console.log(`[${this.ecsClassName}] [log] ${str}`, ...args);
    }
    protected warn(str: any, ...args: any[]) {
        console.warn(`[${this.ecsClassName}] [warn] ${str}`, ...args);
    }
    protected error(str: any, ...args: any[]) {
        console.error(`[${this.ecsClassName}] [error] ${str}`, ...args);
    }
}
