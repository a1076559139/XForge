import { Node, warn } from 'cc';
import { classManager, ecs, EcsBase, ecsclass, flagManager, IComponent, IComponentName, IComponentUUID, IEntity, ITypeofComponent } from './ecs';
import { CacheMap, CreateUUID, UArrayMap } from './EcsUtils';

const componentCache = new CacheMap<IComponent>();
const createUUID = CreateUUID();

@ecsclass('EcsEntity')
export class EcsEntity extends EcsBase implements IEntity {
    /**唯一ID */
    private _uuid = createUUID();
    public get uuid() {
        return this._uuid;
    }

    /**位运算 */
    private flag: number[] = new Array(flagManager.bits).fill(0);

    /**组件的uuid => 组件 */
    private components: Map<IComponentUUID, IComponent> = new Map();

    /**组件的uuid => 绑定的target */
    private insUuidToTarget: Map<IComponentUUID, any> = new Map();

    /**组件的名字 => 组件的uuid数组 */
    private insNameToUuids: UArrayMap<IComponentName, IComponentUUID> = new UArrayMap();

    /**组件及其父类的名字 => 组件的uuid数组 */
    private allNameToUuids: UArrayMap<IComponentName, IComponentUUID> = new UArrayMap();

    /**
     * 更新flag
     */
    private updateFlag() {
        this.insNameToUuids.keys(this.updateFlagCache);
        this.flag = flagManager.getAllByNames(this.updateFlagCache, this.flag);
        this.updateFlagCache.length = 0;
    }
    private updateFlagCache: IComponentName[] = [];

    /**
     * 添加组件(内部调用)
     */
    private innerAddComponent(com: IComponent, target?: any) {
        if (this.components.has(com.uuid)) {
            warn(`重复添加了同一个ecsComponent实例: ${com.ecsName} ${com.uuid}`);
            return false;
        }
        // 组件类名字
        const componentUuid = com.uuid;
        const componentName = com.ecsName;

        // 存储组件的target
        if (typeof target !== 'undefined') {
            this.insUuidToTarget.set(componentUuid, target);
        }

        // 存储组件实例
        this.components.set(componentUuid, com);

        // 添加父类名字到uuid的转换
        classManager.eachSuperName(componentName, (superName) => {
            this.allNameToUuids.add(superName, componentUuid);
        });

        // 添加名字到uuid的转换
        this.allNameToUuids.add(componentName, componentUuid);
        const len = this.insNameToUuids.add(componentName, componentUuid);

        // 新增标记位
        if (len === 1) flagManager.addFlag(this.flag, flagManager.getAllByName(componentName));

        //@ts-ignore
        com.innerEnable(this);

        return true;
    }

    /**
     * 移除组件(内部调用)
     */
    private innerRemoveComponent(com: IComponent, target?: any) {
        if (!this.components.has(com.uuid)) return false;

        // 组件类名字
        const componentUuid = com.uuid;
        const componentName = com.ecsName;

        // 查询权柄
        const myTarget = this.insUuidToTarget.get(componentUuid);
        if (typeof myTarget !== 'undefined') {
            // 权柄不同，无法移除
            if (myTarget !== target) return false;
            // 删除绑定关系
            this.insUuidToTarget.delete(componentUuid);
        }

        // 删除组件实例
        this.components.delete(componentUuid);

        // 删除父类名字到uuid的转换
        classManager.eachSuperName(componentName, (superName) => {
            this.allNameToUuids.sub(superName, componentUuid);
        });

        // 删除名字到uuid的转换
        this.allNameToUuids.subDel(componentName, componentUuid);
        const del = this.insNameToUuids.subDel(componentName, componentUuid);

        // 更新标记位
        if (del) this.updateFlag();

        //@ts-ignore
        com.innerDisable();

        return true;
    }

    /**标记是否已经销毁 */
    private isDestroyed = true;

    private _enabled = true;
    /**标记是否生效 */
    public get enabled() {
        return this._enabled;
    }
    public set enabled(value) {
        this._enabled = value;
    }

    private _isValid = false;
    /**标记是否有效 */
    public get isValid() {
        return this._isValid;
    }
    private set isValid(value) {
        this._isValid = value;
    }

    /**指定ecsID */
    private ecsID = 0;

    /**获取对应的ecs */
    protected get ecs() {
        return ecs.getECS(this.ecsID);
    }

    /**节点 */
    private _node: Node = null;
    public get node(): Node {
        return this._node;
    }
    private set node(value: Node) {
        this._node = value;
    }

    /**
     * 内部初始化函数
     */
    private init(ecsID = 0, node: Node = null) {
        if (!this.isDestroyed) return;
        this.isDestroyed = false;

        this.node = node;
        this.ecsID = ecsID;
        this.isValid = true;
        //@ts-ignore
        this.ecs.addEntity(this);
        this.onEnable();
    }

    /**
     * 销毁
     * 会在触发onDisable和移除所有组件之后才会isValid设为false
     */
    public destroy() {
        if (this.isDestroyed) return false;
        this.isDestroyed = true;

        this.onDisable();
        this.destoryAllComponents();
        this.node = null;
        this.isValid = false;
        //@ts-ignore
        this.ecs.removeEntity(this);
        return true;
    }

    /**
     * 杀死
     * 与destroy的区别是，kill会在触发onDisable和移除所有组件之前就将isValid设为false
     */
    public kill() {
        this.isValid = false;
        return this.destroy();
    }

    private destoryAllComponents() {
        this.insNameToUuids.forEach((uuids) => {
            for (let index = uuids.length - 1; index >= 0; index--) {
                const uuid = uuids[index];
                const com = this.components.get(uuid);
                const target = this.insUuidToTarget.get(uuid);
                com.destroy(target);
            }
        });
    }

    protected onEnable() { }

    protected onDisable() { }

    /**
     * 组件数量
     */
    size() {
        return this.components.size;
    }

    /**
     * 检查是否包含全部
     */
    checkFlagAll(flag: number[]) {
        return flagManager.checkFlagAll(this.flag, flag);

    }
    /**
     * 检查是否包含任一
     */
    checkFlagAny(flag: number[]) {
        return flagManager.checkFlagAny(this.flag, flag);
    }

    /**
     * 检查是否仅包含全部
     */
    checkFlagOnly(flag: number[]) {
        const componentNames = this.insNameToUuids.keys(this.checkFlagOnlyCache);
        for (let index = 0; index < componentNames.length; index++) {
            const componentName = componentNames[index];
            const comFalg = flagManager.getAllByName(componentName);
            const success = flagManager.checkFlagAny(comFalg, flag);
            if (!success) {
                componentNames.length = 0;
                return false;
            }
        }
        componentNames.length = 0;
        return true;
    }
    private checkFlagOnlyCache: string[] = [];

    /**
     * 添加相应类型的组件
     * @param param 类型
     * @param target 权柄
     * @returns 
     */
    addComponent<T extends ITypeofComponent>(param: T | IComponentName | IComponent, target?: any): InstanceType<T> {
        if (typeof param === 'string') {
            param = classManager.getClassByName(param) as T;
        }

        if (!param) return null;

        // 是实例
        if (param instanceof EcsBase) {
            //@ts-ignore
            this.ecs.addComponent(this, param, target);
            return param as InstanceType<T>;
        } else {
            const com = componentCache.get(param.ecsName) || new param();
            //@ts-ignore
            this.ecs.addComponent(this, com, target);
            return com as InstanceType<T>;
        }
    }

    /**
     * 获取相应类型的组件，没有则添加
     * @param param 类型
     * @param target 权柄
     * @returns 
     */
    getOrAddComponent<T extends ITypeofComponent>(param: T | IComponentName, target?: any): InstanceType<T> {
        const com = this.getComponent(param, target);
        if (com) return com;
        return this.addComponent(param, target);
    }

    /**
     * 移除相应类型的第一个组件
     * @param param 类型
     * @param target 权柄
     * @returns 
     */
    removeComponent(param: ITypeofComponent | IComponentName | IComponent, target?: any): boolean {
        if (typeof param === 'string') {
            param = classManager.getClassByName(param) as ITypeofComponent;
        }

        if (!param) return false;

        if (param instanceof EcsBase) {
            //@ts-ignore
            const result = this.ecs.removeComponent(param, target);
            if (result && param.recovery) componentCache.put(param.ecsName, param);
            return result;
        } else {
            const com = this.getComponent(param, target);
            //@ts-ignore
            const result = !!com && this.ecs.removeComponent(com, target);
            if (result && param.recovery) componentCache.put(param.ecsName, com);
            return result;
        }
    }

    /**
     * 移除相应组件的所有组件
     * @param Com 类型
     * @param target 权柄
     * @returns 
     */
    removeComponents(Com: ITypeofComponent | IComponentName, target?: any): boolean {
        const coms = this.getComponents(Com, [], target);
        if (!coms.length) return false;

        return coms.every((com) => {
            //@ts-ignore
            return this.ecs.removeComponent(com, target);
        });
    }

    /**
     * 移除所有组件
     * @param except 排除
     * @param target 权柄
     */
    removeAllComponents(except?: (ITypeofComponent | IComponentName)[] | ITypeofComponent | IComponentName, target?: any) {
        const componentNames = except
            ? except instanceof Array
                ? except.map((type: ITypeofComponent | IComponentName) => typeof type === 'string' ? type : type.ecsName)
                : typeof except === 'string' ? except : except.ecsName
            : [];

        this.insNameToUuids.forEach((uuids, name) => {
            if (componentNames.indexOf(name) >= 0) return;
            for (let index = uuids.length - 1; index >= 0; index--) {
                this.components
                    .get(uuids[index])
                    .destroy(target);
            }
        });
    }

    /**
     * 有没有相应类型的组件
     * 绑定权柄的组件也能获取到
     */
    hasComponent(Com: ITypeofComponent | IComponentName, target?: any): boolean {
        const componentName = typeof Com === 'string' ? Com : Com.ecsName;
        const uuids = this.allNameToUuids.get(componentName);
        if (!uuids || uuids.length === 0) return false;

        if (typeof target === 'undefined') return true;
        return uuids.some((uuid) => {
            return this.insUuidToTarget.get(uuid) === target;
        });
    }

    /**
     * 获取相应类型的组件
     * 绑定权柄的组件也能获取到
     */
    getComponent<T extends ITypeofComponent>(Com: T | IComponentName, target?: any): InstanceType<T> {
        const componentName = typeof Com === 'string' ? Com : Com.ecsName;

        {
            // 先查直接对应
            const uuids = this.insNameToUuids.get(componentName);
            if (uuids && uuids.length) {
                if (typeof target !== 'undefined') {
                    const uuid = uuids.find(uuid => this.insUuidToTarget.get(uuid) === target);
                    return uuid ? this.components.get(uuid) as InstanceType<T> : null;
                } else {
                    return this.components.get(uuids[0]) as InstanceType<T>;
                }
            }
        }
        {
            // 再查父类对应
            const uuids = this.allNameToUuids.get(componentName);
            if (uuids && uuids.length) {
                if (typeof target !== 'undefined') {
                    const uuid = uuids.find(uuid => this.insUuidToTarget.get(uuid) === target);
                    return uuid ? this.components.get(uuid) as InstanceType<T> : null;
                } else {
                    return this.components.get(uuids[0]) as InstanceType<T>;
                }
            }
        }

        return null;
    }

    /**
     * 获取相应类型的组件
     * 绑定权柄的组件也能获取到
     */
    getComponents<T extends ITypeofComponent>(Com: T | IComponentName, out?: InstanceType<T>[], target?: any): InstanceType<T>[] {
        if (!out) out = [];

        const componentName = typeof Com === 'string' ? Com : Com.ecsName;

        {
            // 先查直接对应
            const uuids = this.insNameToUuids.get(componentName);
            if (uuids && uuids.length) {
                if (typeof target !== 'undefined') {
                    uuids.forEach((uuid) => {
                        if (this.insUuidToTarget.get(uuid) === target) {
                            out.push(this.components.get(uuid) as InstanceType<T>);
                        }
                    });
                } else {
                    uuids.forEach((uuid) => {
                        out.push(this.components.get(uuid) as InstanceType<T>);
                    });
                }
                return out;
            }
        }
        {
            // 再查父类对应
            const uuids = this.allNameToUuids.get(componentName);
            if (uuids && uuids.length) {
                if (typeof target !== 'undefined') {
                    uuids.forEach((uuid) => {
                        if (this.insUuidToTarget.get(uuid) === target) {
                            out.push(this.components.get(uuid) as InstanceType<T>);
                        }
                    });
                } else {
                    uuids.forEach((uuid) => {
                        out.push(this.components.get(uuid) as InstanceType<T>);
                    });
                }
                return out;
            }
        }

        return out;
    }
}
