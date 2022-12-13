import { Component, Node, warn, _decorator } from "cc";
import { classManager, ecs, FlagBits, flagManager } from "./ecs";
import { EcsComponent } from "./EcsComponent";
import { NumberMap, UArrayMap } from "./EcsUtils";

const { ccclass } = _decorator;

type IComponentUUID = string;
type IComponentName = string;

@ccclass
export default class EcsEntity extends Component {
    static get(com: EcsComponent): EcsEntity {
        return com.entity as EcsEntity;
    }

    static create(node?: Node): EcsEntity {
        if (node) {
            const entity = node.addComponent(this);
            return entity;
        } else {
            const entity = new this();
            entity.onEnable();
            return entity;
        }
    }

    private flag: number[] = new Array(FlagBits).fill(0);
    private components: Map<IComponentUUID, EcsComponent> = new Map();
    private componentsCount: NumberMap<IComponentName> = new NumberMap();
    /**
     * uuid绑定target
     */
    private uuidBindTarget: Map<IComponentUUID, any> = new Map();
    /**
     * 只记录自身名字与uuid对应关系
     */
    private nameToUuids: UArrayMap<IComponentName, IComponentUUID> = new UArrayMap();
    /**
     * 记录所有名字(自身与父类)与uuid对应关系
     */
    private allNameToUuids: UArrayMap<IComponentName, IComponentUUID> = new UArrayMap();

    /**
    * 指定ecs名字
    */
    public ecsName: string = 'default';
    public get ecs() {
        return ecs.getECS(this.ecsName);
    }

    /**
     * 更新flag
     */
    private updateFlag() {
        const names: IComponentName[] = [];
        this.componentsCount.forEach((count, name) => names.push(name));
        this.flag = flagManager.getAllByNames(names);
    }

    /**
     * 添加组件(内部调用)
     */
    private innerAddComponent(com: EcsComponent, target?: any) {
        if (this.components.has(com.uuid)) {
            warn(`重复添加了同一个ecsComponent实例: ${com.ecsClassName} ${com.uuid}`);
            return false;
        }
        // 组件类名字
        const componentUuid = com.uuid;
        const componentName = com.ecsClassName;

        // 存储组件实例
        this.components.set(componentUuid, com);

        // 存储每种组件实例的个数
        this.componentsCount.add(componentName);

        // 存储组件的target
        if (typeof target !== 'undefined') {
            this.uuidBindTarget.set(componentUuid, target);
        }

        // 添加名字到uuid的转换
        this.nameToUuids.add(componentName, componentUuid);
        this.allNameToUuids.add(componentName, componentUuid);

        // 添加父类名字到uuid的转换
        classManager.eachSuperName(componentName, (superName) => {
            this.allNameToUuids.add(superName, componentUuid);
        })

        // 新增标记位
        flagManager.addFlag(this.flag, flagManager.getAllByName(componentName));

        //@ts-ignore
        com.innerEnable();

        return true;
    }

    /**
     * 移除组件(内部调用)
     */
    private innerRemoveComponent(com: EcsComponent, target?: any) {
        if (!this.components.has(com.uuid)) return false;

        // 组件类名字
        const componentUuid = com.uuid;
        const componentName = com.ecsClassName;

        // 查询权柄
        const myTarget = this.uuidBindTarget.get(componentUuid);
        if (typeof myTarget !== 'undefined') {
            // 权柄不同，无法移除
            if (myTarget !== target) return false;
            // 删除绑定关系
            this.uuidBindTarget.delete(componentUuid);
        }

        // 删除组件实例
        this.components.delete(componentUuid);

        // 删除名字到uuid的转换
        this.nameToUuids.sub(componentName, componentUuid);
        this.allNameToUuids.sub(componentName, componentUuid);

        // 删除父类名字到uuid的转换
        classManager.eachSuperName(componentName, (superName) => {
            this.allNameToUuids.sub(superName, componentUuid);
        })

        // 删除并返回是否为空
        const isEmpty = this.componentsCount.subDel(componentName);

        // 更新标记位
        if (isEmpty) this.updateFlag();

        //@ts-ignore
        com.innerDisable();

        return true;
    }

    private isEntityDestroy = false;
    private _isEntityValid = false;
    /**标记是否有效 */
    public get isEntityValid() {
        return this._isEntityValid;
    }
    private set isEntityValid(value) {
        this._isEntityValid = value;
    }
    protected onLoad() { }

    protected onEnable() {
        if (this.isEntityValid) return;
        this.isEntityValid = true;
        //@ts-ignore
        this.ecs.addEntity(this);
    }

    protected onDisable() {
        if (!this.isEntityValid) return;
        this.isEntityValid = false;
        //@ts-ignore
        this.ecs.removeEntity(this);
    }

    protected onDestroy() {
        if (this.isEntityDestroy) return;
        this.isEntityDestroy = true;
        this.isEntityValid = false;
        // 移除所有组件
        this.destoryAllComponents();
        // @ts-ignore
        this.ecs.removeEntity(this);
        // 销毁节点
        if (this.node?.isValid) this.node.destroy();
    }

    private destoryAllComponents() {
        this.nameToUuids.forEach((uuids) => {
            uuids.forEach((uuid) => {
                const com = this.components.get(uuid);
                const target = this.uuidBindTarget.get(uuid)
                this.removeComponent(com, target);
            })
        })
    }

    /**
     * 移除实体
     * 与destroy的区别是：
     * 1、调用kill，在component的onDisable方法中获取到entity的isEntityValid为true
     * 2、调用destroy，在component的onDisable方法中获取到entity的isEntityValid为false
     * 而且，destroy是由cocos控制的，他的触发时机总是在当前帧的最后才调用
     */
    kill() {
        if (this.isEntityDestroy) return;
        this.isEntityDestroy = true;
        // 移除所有组件
        this.destoryAllComponents();
        // 设为无效
        this.isEntityValid = false;
        // @ts-ignore
        this.ecs.removeEntity(this);
        // 销毁(由于继承自cc.Component，需要判断node是否存在)
        if (this.node?.isValid) this.node.destroy();
    }

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
        const nameIterator = this.componentsCount.keys();
        while (nameIterator) {
            const iteratorResult = nameIterator.next();
            if (!iteratorResult) break;
            const componentName = iteratorResult.value;
            if (!componentName) break;
            const comFalg = flagManager.getAllByName(componentName);
            const result = flagManager.checkFlagAny(comFalg, flag);
            if (!result) break;
            if (iteratorResult.done) return true;
        }

        return false;
    }

    /**
     * 添加相应类型的组件
     * @param Com 类型
     * @param target 权柄
     * @returns 
     */
    addComponent<T extends typeof EcsComponent>(Com: T | IComponentName | InstanceType<T>, target?: any): InstanceType<T> {
        if (Com instanceof EcsComponent) {
            //@ts-ignore
            Com.innerInit(this);
            //@ts-ignore
            this.ecs.addComponent(Com, target);

            return Com as InstanceType<T>;
        }

        if (typeof Com === 'string') Com = classManager.getClassByName(Com) as T;

        return this.addComponent(new Com() as InstanceType<T>, target);
    }

    /**
     * 获取相应类型的组件，没有则添加
     * @param Com 类型
     * @param target 权柄
     * @returns 
     */
    getOrAddComponent<T extends typeof EcsComponent>(Com: T | IComponentName, target?: any): InstanceType<T> {
        const com = this.getComponent(Com, target);
        if (com) return com;
        return this.addComponent(Com, target);
    }

    /**
     * 移除相应类型的第一个组件
     * @param Com 类型
     * @param target 权柄
     * @returns 
     */
    removeComponent(Com: typeof EcsComponent | IComponentName | EcsComponent, target?: any) {
        if (Com instanceof EcsComponent) {
            //@ts-ignore
            return Com.isValid && this.ecs.removeComponent(Com, target);
        }

        const com = this.getComponent(Com, target);
        if (com) {
            //@ts-ignore
            return this.ecs.removeComponent(com, target);
        }
        return false;
    }

    /**
     * 移除相应组件的所有组件
     * @param Com 类型
     * @param target 权柄
     * @returns 
     */
    removeComponents(Com: typeof EcsComponent | IComponentName, target?: any) {
        const coms = this.getComponents(Com, [], target);
        if (!coms.length) return false;

        return coms.every((com) => {
            //@ts-ignore
            return this.ecs.removeComponent(com, target);
        })
    }

    /**
     * 移除所有组件
     * @param except 排除
     * @param target 权柄
     */
    removeAllComponents(except?: (typeof EcsComponent | IComponentName)[] | typeof EcsComponent | IComponentName, target?: any) {
        const componentNames = except
            ? except instanceof Array
                ? except.map((type: typeof EcsComponent | IComponentName) => typeof type === 'string' ? type : type.ecsClassName)
                : typeof except === 'string' ? except : except.ecsClassName
            : []

        this.nameToUuids.forEach((uuids, name) => {
            if (componentNames.indexOf(name) >= 0) return;
            uuids.forEach((uuid) => {
                if (target) {
                    if (this.uuidBindTarget.get(uuid) === target) this.components.get(uuid).destroy(target);
                } else {
                    this.components.get(uuid).destroy(target);
                }
            })
        })
    }

    /**
     * 有没有相应类型的组件
     * 绑定权柄的组件也能获取到
     */
    hasComponent(Com: typeof EcsComponent | IComponentName, target?: any): boolean {
        const componentName = typeof Com === 'string' ? Com : Com.ecsClassName;
        const uuids = this.allNameToUuids.get(componentName);
        if (!uuids || uuids.length === 0) return false;

        if (typeof target === 'undefined') return true;
        return uuids.some((uuid) => {
            return this.uuidBindTarget.get(uuid) === target;
        })
    }

    /**
     * 获取相应类型的组件
     * 绑定权柄的组件也能获取到
     */
    getComponent<T extends typeof EcsComponent>(Com: T | IComponentName, target?: any): InstanceType<T> {
        const componentName = typeof Com === 'string' ? Com : Com.ecsClassName;

        {
            // 先查直接对应
            const uuids = this.nameToUuids.get(componentName);
            if (uuids && uuids.length) {
                if (typeof target !== 'undefined') {
                    const uuid = uuids.find(uuid => this.uuidBindTarget.get(uuid) === target);
                    return uuid ? this.components.get(uuid) as InstanceType<T> : null;
                } else {
                    return this.components.get(uuids[0]) as InstanceType<T>
                }
            }
        }
        {
            // 再查父类对应
            const uuids = this.allNameToUuids.get(componentName);
            if (uuids && uuids.length) {
                if (typeof target !== 'undefined') {
                    const uuid = uuids.find(uuid => this.uuidBindTarget.get(uuid) === target);
                    return uuid ? this.components.get(uuid) as InstanceType<T> : null;
                } else {
                    return this.components.get(uuids[0]) as InstanceType<T>
                }
            }
        }

        return null;
    }

    /**
     * 获取相应类型的组件
     * 绑定权柄的组件也能获取到
     */
    getComponents<T extends typeof EcsComponent>(Com: T | IComponentName, out?: InstanceType<T>[], target?: any): InstanceType<T>[] {
        if (!out) out = [];

        const componentName = typeof Com === 'string' ? Com : Com.ecsClassName;

        {
            // 先查直接对应
            const uuids = this.nameToUuids.get(componentName);
            if (uuids && uuids.length) {
                if (typeof target !== 'undefined') {
                    uuids.forEach((uuid) => {
                        if (this.uuidBindTarget.get(uuid) === target) {
                            out.push(this.components.get(uuid) as InstanceType<T>);
                        }
                    })
                } else {
                    uuids.forEach((uuid) => {
                        out.push(this.components.get(uuid) as InstanceType<T>);
                    })
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
                        if (this.uuidBindTarget.get(uuid) === target) {
                            out.push(this.components.get(uuid) as InstanceType<T>);
                        }
                    })
                } else {
                    uuids.forEach((uuid) => {
                        out.push(this.components.get(uuid) as InstanceType<T>);
                    })
                }
                return out;
            }
        }

        return out;
    }
}
