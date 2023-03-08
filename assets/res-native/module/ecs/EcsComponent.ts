import { EcsBase, ecsclass, IComponent, IEntity, ITypeofComponent } from './ecs';
import { CreateUUID } from './EcsUtils';

const createUUID = CreateUUID();

@ecsclass('EcsComponent')
export class EcsComponent<E extends IEntity = IEntity> extends EcsBase implements IComponent {
    /**
     * 唯一ID
     */
    private _uuid = createUUID();
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
    private set isValid(value) {
        this._isValid = value;
    }

    /**
     * 组件的实体
     */
    private _entity: E = null;
    public get entity() {
        return this._entity;
    }
    private set entity(value) {
        this._entity = value;
    }

    /**
     * 融合的EcsComponent
     */
    protected mixs: ITypeofComponent[] = [];
    /**
     * 融合处理
     */
    protected handleMixComponent(com: IComponent, index: number) { }

    /**
     * 内部生效函数
     */
    private innerEnable(entity: E) {
        this.isValid = true;
        this.entity = entity;
        this.beforeEnable();
        this.onEnable();
    }

    /**
     * 内部失效函数
     */
    private innerDisable() {
        this.onDisable();
        this.afterDisable();
        this.isValid = false;
        this.entity = null;
    }

    /**
     * 组件生效之前
     */
    protected beforeEnable() {
        this.mixs.forEach((Component, index) => {
            const com = this.entity?.addComponent(Component, this);
            this.handleMixComponent(com, index);
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
            this.entity?.removeComponent(Comment, this);
        });
    }

    /**
     * 销毁
     * @param target 权柄
     */
    public destroy(target?: any): boolean {
        if (!this.entity) return false;
        return this.entity.removeComponent(this, target);
    }

    protected log(...args: any[]) {
        console.log(`[${this.ecsName}] [log]`, ...args);
    }
    protected warn(...args: any[]) {
        console.warn(`[${this.ecsName}] [warn]`, ...args);
    }
    protected error(...args: any[]) {
        console.error(`[${this.ecsName}] [error]`, ...args);
    }
}
