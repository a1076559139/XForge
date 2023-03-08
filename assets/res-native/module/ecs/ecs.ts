import { Node } from 'cc';
import { Cache, NumberMap } from './EcsUtils';

export type IEntityUUID = number;
export type IComponentName = string;
export type IComponentUUID = number;
export type IFlag = number[];

export type ITypeofComponent = { new(): IComponent, ecsName: string, recovery: boolean };
export type ITypeofSystem = { prototype: ISystem, ecsName: string, recovery: boolean };
export type ITypeofEntity = { new(): IEntity, ecsName: string, recovery: boolean };

export interface IComponent<E extends IEntity = IEntity> extends EcsBase {
    entity: E;
    isValid: boolean;
    uuid: IComponentUUID;
    destroy(target?: any): boolean;
}

export interface IEntity extends EcsBase {
    uuid: IEntityUUID
    isValid: boolean
    enabled: boolean
    readonly node: Node
    destroy(): boolean
    size(): number
    checkFlagAll(flag: IFlag): boolean
    checkFlagAny(flag: IFlag): boolean
    checkFlagOnly(flag: IFlag): boolean
    addComponent<T extends ITypeofComponent>(Com: T | IComponentName, target?: any): InstanceType<T>
    getOrAddComponent<T extends ITypeofComponent>(Com: T | IComponentName, target?: any): InstanceType<T>
    removeComponent(Com: ITypeofComponent | IComponentName | IComponent, target?: any): boolean
    removeComponents(Com: ITypeofComponent | IComponentName, target?: any): boolean;
    removeAllComponents(except?: (ITypeofComponent | IComponentName)[] | ITypeofComponent | IComponentName, target?: any): void;
    hasComponent(Com: ITypeofComponent | IComponentName, target?: any): boolean
    getComponent<T extends ITypeofComponent>(Com: T | IComponentName, target?: any): InstanceType<T>
    getComponents<T extends ITypeofComponent>(Com: T | IComponentName, out?: InstanceType<T>[], target?: any): InstanceType<T>[]
}

export type ISystem = EcsBase;

interface IECS {
    /**过滤条件 */
    filter: Filter
    addSystem<T extends ITypeofSystem>(System: T): void
    removeSystem<T extends ITypeofSystem>(System: T): void
    /**添加单例组件 */
    addSingletion<T extends ITypeofComponent>(param: T): InstanceType<T>
    addSingletion<T extends IComponent>(param: T): T
    /**获取单例组件 */
    getSingletion<T extends ITypeofComponent>(param: T): InstanceType<T>
    /**移除单例组件 */
    removeSingletion<T extends ITypeofComponent>(param: T): InstanceType<T>
    /**创建一个实体 */
    createEntity<T extends ITypeofEntity>(Entity: T, options?: { node?: Node, ecsID?: number }): InstanceType<T>
    /**清理所有数据 */
    clearAll(): any
    /**一般由游戏循环驱动 */
    execute(...args: any[]): any
    /**等同于execute，一般情况下用不到，比如当需要区分逻辑帧与渲染帧时，用于渲染帧 */
    update(...args: any[]): any
}

interface IECSManager extends IECS {
    getECS(ecsID: number): IECS
    deleteECS(ecsID: number): void
    clearECSs(): void
}

export class EcsBase {
    /**类名 */
    static ecsName = 'EcsBase';
    /**类名 */
    public get ecsName() {
        return (this.constructor as typeof EcsBase).ecsName;
    }
    /**回收 */
    static recovery = false;
    /**回收 */
    public get recovery() {
        return (this.constructor as typeof EcsBase).recovery;
    }
    /**生效*/
    protected onEnable() { }
    /**失效*/
    protected onDisable() { }
}

/** 
 * flag位管理器
*/
class FlagManager {
    private index: number = 0;
    private cache: Map<string, IFlag> = new Map();
    private cacheAll: Map<string, IFlag> = new Map();

    addFlag(source: IFlag, flag: IFlag) {
        for (let index = 0; index < flag.length; index++) {
            source[index] |= flag[index];
        }
    }
    removeFlag(source: IFlag, flag: IFlag) {
        for (let index = 0; index < flag.length; index++) {
            source[index] &= ~flag[index];
        }
    }

    /**
     * 检查是否完全包含
     * @param source 源
     * @param sub 子集
     */
    checkFlagAll(source: IFlag, sub: IFlag) {
        for (let index = 0; index < sub.length; index++) {
            if ((source[index] & sub[index]) !== sub[index]) return false;
        }
        return true;
    }
    /**
     * 只包含其中一个即可
     * @param source 源
     * @param sub 子集
     */
    checkFlagAny(source: IFlag, sub: IFlag) {
        for (let index = 0; index < sub.length; index++) {
            if ((source[index] & sub[index]) != 0) return true;
        }
        return false;
    }

    /**
     * 会融合父类
     */
    getAllByName(name: string): IFlag {
        const result = this.cacheAll.get(name);
        if (result) return result;

        const names = [name];
        classManager.eachSuperName(name, (superName) => {
            names.push(superName);
        });

        const flag = this.getByNames(names);
        this.cacheAll.set(name, flag);

        return flag;
    }

    /**
     * 会融合父类
     */
    getAllByNames(names: string[], out: number[]): IFlag {
        // 设置初始值
        let flag = this.getAllByName(names[0]);
        for (let index = 0; index < out.length; index++) {
            out[index] = flag[index];
        }
        // 叠加
        for (let i = 1; i < names.length; i++) {
            flag = this.getAllByName(names[i]);
            for (let index = 0; index < out.length; index++) {
                out[index] = out[index] | flag[index];
            }
        }
        return out;
    }

    /**
     * 只计算自身
     */
    getByName(name: string): IFlag {
        const result = this.cache.get(name);
        if (result) return result;

        const FlagBits = this.bits;

        if (this.index >= FlagBits * 31) {
            throw new Error(`当前Component的种类超过${FlagBits * 31}个`);
        }

        const flag: IFlag = new Array(FlagBits).fill(0);
        flag[(this.index / 31) >>> 0] = (1 << (this.index % 31));
        this.cache.set(name, flag);
        this.index++;

        return flag;
    }

    /**
     * 只计算自身
     */
    getByNames(names: string[]): IFlag {
        const result = new Array(this.bits);
        // 设置初始值
        let flag = this.getByName(names[0]);
        for (let index = 0; index < result.length; index++) {
            result[index] = flag[index];
        }
        // 叠加
        for (let i = 1; i < names.length; i++) {
            flag = this.getByName(names[i]);
            for (let index = 0; index < result.length; index++) {
                result[index] = result[index] | flag[index];
            }
        }
        return result;
    }

    get bits() {
        return Math.ceil(classManager.comSize / 31);
    }
}
export const flagManager = new FlagManager();

/**
 * 类管理器
 */
class ClassManager {
    private comClassCount = 0;
    private nameToSuperName: Map<string, string> = new Map();
    private nameToClass: Map<string, ITypeofComponent | ITypeofSystem> = new Map();
    /**
     * 获取父类
     */
    private getSuper<T extends typeof EcsBase>(type: T): T {
        if (!type || !type.prototype) return null;
        const proto = type.prototype; // binded function do not have prototype
        const dunderProto = proto && Object.getPrototypeOf(proto);
        return dunderProto && dunderProto.constructor;
    }

    add(ctor: ITypeofComponent, className: string) {
        if (this.nameToClass.has(className)) {
            console.error(`[ecs] ${className}已存在`);
        }
        this.nameToClass.set(className, ctor);

        // 存储类名继承对应关系
        let superClss = this.getSuper(ctor);
        while (superClss && superClss !== EcsBase) {
            this.nameToSuperName.set(className, superClss.ecsName);
            superClss = this.getSuper(ctor = superClss);
            className = ctor.ecsName;
        }

        if (ctor.ecsName === 'EcsComponent') {
            this.comClassCount++;
        }
    }

    /**
     * 遍历所有父类名
     */
    eachSuperName(subName: string, callback: (superName: string) => any) {
        while (subName) {
            const superName = this.getSuperName(subName);
            if (!superName) break;
            callback(subName = superName);
        }
    }

    isChildByName(subName: string, superName: string) {
        if (!subName) return false;
        if (!superName) return false;

        while (subName) {
            const _superName = this.getSuperName(subName);
            if (_superName === superName) return true;
            subName = _superName;
        }

        return false;
    }

    /**
     * 通过类名获取一个类
     * @param name 
     * @returns 
     */
    getClassByName(name: string) {
        return this.nameToClass.get(name);
    }

    /**
     * 获取父类名字
     */
    getSuperName(name: string) {
        return this.nameToSuperName.get(name) || '';
    }

    /**
     * 组件种类数量
     */
    get comSize() {
        return this.comClassCount;
    }
}
export const classManager = new ClassManager();

/**
 * EcsComponent与EcsSystem装饰器
 */
export function ecsclass(className: string, recovery = false) {
    return function fNOP(ctor: any) {
        // ecsName需要先初始化
        (<typeof EcsBase>ctor).ecsName = className;
        (<typeof EcsBase>ctor).recovery = recovery;
        classManager.add(ctor, className);
        return ctor;
    };
}

/**
 * 组件管理器
 */
class ComponentManager {
    private entities: Map<IComponentName, NumberMap<IEntity>> = new Map();

    private getEntities(name: IComponentName) {
        if (!this.entities.has(name)) {
            this.entities.set(name, new NumberMap());
        }
        return this.entities.get(name);
    }

    /**
     * 添加一个组件名对应的实体
     */
    addEntity(comName: IComponentName, entity: IEntity) {
        if (!comName) return;

        // 添加当前
        this.getEntities(comName).add(entity);

        // 添加基类
        this.addEntity(classManager.getSuperName(comName), entity);
    }

    /**
     * 移除一个组件名对应的实体
     */
    removeEntity(comName: IComponentName, entity: IEntity) {
        if (!comName) return;

        // 删除当前
        if (!this.hasEntities(comName)) return;
        this.getEntities(comName).subDel(entity);

        // 删除基类
        this.removeEntity(classManager.getSuperName(comName), entity);
    }

    /**
     * 根据组件名判断是否有实体存在
     */
    hasEntities(comName: IComponentName) {
        return this.entities.get(comName) || null;
    }

    each(callback: (value: NumberMap<IEntity>) => void) {
        this.entities.forEach(function (value) {
            callback(value);
        });
    }

    clear() {
        this.entities.clear();
    }
}

/**
 * 实体管理器
 */
class EntityManager {
    private entities: Map<IEntityUUID, IEntity> = new Map();

    has(uuid: IEntityUUID) {
        return this.entities.get(uuid) || null;
    }

    add(entity: IEntity) {
        this.entities.set(entity.uuid, entity);
    }

    remove(entity: IEntity) {
        return this.entities.delete(entity.uuid);
    }

    get(uuid: IEntityUUID) {
        return this.entities.get(uuid) || null;
    }

    getAll(out: IEntity[]) {
        this.entities.forEach(entity => out.push(entity));
        return out;
    }

    each(callback: (value: IEntity) => void) {
        this.entities.forEach(callback);
    }

    clear() {
        this.entities.clear();
    }
}

/**
 * 系统管理器
 */
class SystemManager {
    private systems: ISystem[] = [];

    /**
     * 添加系统
     */
    add(system: ISystem) {
        this.systems.push(system);
    }

    get(System: ITypeofSystem) {
        const index = this.systems.findIndex(system => system.ecsName === System.ecsName);
        return this.systems[index];
    }

    /**
     * 移除系统
     */
    remove(System: ITypeofSystem) {
        const index = this.systems.findIndex(system => system.ecsName === System.ecsName);
        if (index >= 0) {
            return this.systems.splice(index, 1)[0] || null;
        }
        return null;
    }

    /**
     * 清空所有
     */
    clear() {
        this.systems.length = 0;
    }

    each(callback: (value: ISystem) => void) {
        this.systems.forEach(callback);
    }

    get size() {
        return this.systems.length;
    }
}

export interface IFilter {
    /**
     * 有这些组件中的任何一个
     */
    any(...args: ITypeofComponent[]): this
    /**
     * 必须包含所有这些组件
     */
    all(...args: ITypeofComponent[]): this
    /**
     * 仅仅只有这些组件
     */
    only(...args: ITypeofComponent[]): this
    /**
     * 不能包含其中的任何一个组件
     */
    exclude(...args: ITypeofComponent[]): this
}

class Filter implements IFilter {
    static query(entityManager: EntityManager, componentManager: ComponentManager, filter: Filter) {
        let result: IEntity[] = [];
        if (!filter) return result;

        // 优先验证anys
        if (result.length === 0 && filter.anys.length !== 0) {
            filter.anys.forEach(comName => {
                const entities = componentManager.hasEntities(comName);
                if (entities && entities.size) entities.forEach((comCount, entity) => {
                    if (result.indexOf(entity) >= 0) return;
                    result.push(entity);
                });
            });
            if (result.length === 0) return result;
        }

        // 其次验证include
        if (result.length === 0 && filter.include) {
            const entities = componentManager.hasEntities(filter.include);
            if (entities && entities.size) entities.keys(result);
            if (result.length === 0) return result;
        }

        // 还查询不到，获取所有
        if (result.length === 0 && filter.hasExclude) {
            entityManager.getAll(result);
        }

        // 没有实体
        if (result.length === 0) return result;

        filter.pipeline.forEach(handle => result = handle(result));

        return result;
    }

    static find(entityManager: EntityManager, componentManager: ComponentManager, filter: Filter) {
        if (!filter) return null;

        let result: IEntity[] = [];

        // 优先验证anys
        for (let index = 0, len = filter.anys.length; index < len; index++) {
            const comName = filter.anys[index];
            const entities = componentManager.hasEntities(comName);
            if (!entities) continue;
            if (entities.size === 0) continue;
            entities.keys(result);
            // 只要有任何一个any符合筛选条件，就返回
            filter.pipeline.forEach(handle => result = handle(result));
            if (result.length) return result[0];
        }

        // 其次验证include
        if (filter.include) {
            const entities = componentManager.hasEntities(filter.include);
            if (entities && entities.size) entities.keys(result);
            if (result.length === 0) return null;
        }

        // 获取所有
        if (result.length === 0 && filter.hasExclude) {
            entityManager.getAll(result);
        }

        if (result.length === 0) return null;

        filter.pipeline.forEach(handle => result = handle(result));

        return result.length > 0 ? result[0] : null;
    }

    private anys: IComponentName[] = [];
    private include: IComponentName = '';
    private hasExclude: boolean = false;
    private pipeline: ((entities: IEntity[]) => IEntity[])[] = [];

    constructor() {
        this.pipeline.push(function valid(entities: IEntity[]) {
            return entities.filter(entity => entity.enabled && entity.isValid);
        });
    }

    /**
     * 有这些组件中的任何一个
     */
    any(...coms: ITypeofComponent[]) {
        if (coms.length === 0) return this;

        coms.forEach(com => {
            if (this.anys.indexOf(com.ecsName) >= 0) return;
            this.anys.push(com.ecsName);
        });

        return this;
    }
    /**
     * 必须包含所有这些组件
     */
    all(...coms: ITypeofComponent[]) {
        if (coms.length === 0) return this;
        if (!this.include) this.include = coms[0].ecsName;

        let flag: IFlag = null;
        this.pipeline.push(function all(entities: IEntity[]) {
            if (!flag) flag = flagManager.getByNames(coms.map(com => com.ecsName));
            return entities.filter(entity => entity.checkFlagAll(flag));
        });
        return this;
    }
    /**
     * 仅仅只有这些组件
     */
    only(...coms: ITypeofComponent[]) {
        if (coms.length === 0) return this;
        if (!this.include) this.include = coms[0].ecsName;

        let flag: IFlag = null;
        this.pipeline.push(function only(entities: IEntity[]) {
            if (!flag) flag = flagManager.getByNames(coms.map(com => com.ecsName));
            return entities.filter(entity => entity.checkFlagOnly(flag));
        });
        return this;
    }
    /**
     * 不能包含其中的任何一个组件
     */
    exclude(...coms: ITypeofComponent[]) {
        if (coms.length === 0) return this;
        this.hasExclude = true;

        let flag: IFlag = null;
        this.pipeline.push(function exclude(entities: IEntity[]) {
            if (!flag) flag = flagManager.getByNames(coms.map(com => com.ecsName));
            return entities.filter(entity => !entity.checkFlagAny(flag));
        });

        return this;
    }
}

const entityCache = new Cache<IEntity>;

export class ECS implements IECS {
    private entityManager = new EntityManager();
    private systemManager = new SystemManager();
    private componentManager = new ComponentManager();
    private singletions: IComponent[] = [];

    /**
     * 过滤条件
     */
    public get filter() {
        return new Filter();
    }

    /**
     * 查询实体
     */
    public query<T extends IEntity>(filter: IFilter): T[];
    public query<T extends IComponent>(filter: IFilter, Comment: { new(): T }): T[];
    public query<T>(filter: IFilter, Comment?: ITypeofComponent): T[] {
        const entities = Filter.query(this.entityManager, this.componentManager, filter as any);
        if (!Comment) return entities as T[];
        return entities.map(entity => entity.getComponent(Comment)) as T[];
    }

    /**
     * 查询实体
     */
    public find<T extends IEntity>(filter: IFilter): T;
    public find<T extends IComponent>(filter: IFilter, Comment: { new(): T }): T;
    public find<T>(filter: IFilter, Comment?: ITypeofComponent): T {
        const entity = Filter.find(this.entityManager, this.componentManager, filter as any);
        if (!entity) return null;
        if (!Comment) return entity as T;
        return entity.getComponent(Comment) as T;
    }

    /**
     * 查询是否存在
     */
    public exist(filter: IFilter) {
        return !!Filter.find(this.entityManager, this.componentManager, filter as any);
    }

    /**
     * 添加单例组件
     */
    public addSingletion<T extends ITypeofComponent>(param: T): InstanceType<T>;
    public addSingletion<T extends IComponent>(param: T): T;
    public addSingletion(param: ITypeofComponent | IComponent) {
        const com = this.singletions.find(com => com.ecsName === param.ecsName);
        if (com) return com;

        if (param instanceof EcsBase) {
            this.singletions.push(param);
            //@ts-ignore
            param.innerEnable();
            return param;
        } else {
            const com = new param();
            this.singletions.push(com);
            //@ts-ignore
            com.innerEnable();
            return com;
        }
    }

    /**
     * 获取单例组件
     */
    public getSingletion<T extends ITypeofComponent>(param: T): InstanceType<T> {
        return this.singletions.find(com => com.ecsName === param.ecsName) as InstanceType<T>;
    }

    /**
     * 移除单例组件
     */
    public removeSingletion<T extends ITypeofComponent>(param: T): InstanceType<T> {
        const index = this.singletions.findIndex(com => com.ecsName === param.ecsName);
        if (index >= 0) {
            const com = this.singletions.splice(index, 1)[0];
            //@ts-ignore
            com.innerDisable();
            return com as InstanceType<T>;
        }
        return null;
    }

    /**
     * 创建一个实体
     */
    public createEntity<T extends ITypeofEntity>(Entity: T, options?: { node?: Node, ecsID?: number }): InstanceType<T> {
        const entity = entityCache.get() || new Entity();
        //@ts-ignore
        entity.init(options?.ecsID, options?.node);
        return entity as InstanceType<T>;
    }

    /**
     * 添加一个实体
     */
    protected addEntity(entity: IEntity) {
        this.entityManager.add(entity);
    }

    /**
     * 移除一个实体
     */
    protected removeEntity(entity: IEntity) {
        this.entityManager.remove(entity);
        if (entity.recovery) entityCache.put(entity);
    }

    /**
     * 添加一个组件
     */
    protected addComponent(entity: IEntity, component: IComponent, target?: any) {
        //@ts-ignore
        const result = entity.innerAddComponent(component, target) as boolean;
        if (!result) return false;

        this.componentManager.addEntity(component.ecsName, entity);
        return true;
    }

    /**
     * 移除一个组件
     */
    protected removeComponent(component: IComponent, target?: any) {
        const entity = component.entity;
        const componentName = component.ecsName;
        //@ts-ignore
        const result = entity.innerRemoveComponent(component, target) as boolean;
        if (!result) return false;

        this.componentManager.removeEntity(componentName, entity);
        return true;
    }

    /**
    * 添加一个系统
    */
    public addSystem<T extends ITypeofSystem>(System: T): void {
        //@ts-ignore
        const system = new System();
        this.systemManager.add(system);
        //@ts-ignore
        system.onEnable();
    }

    /**
     * 移除一个系统
     */
    public removeSystem<T extends ITypeofSystem>(System: T): void {
        const system = this.systemManager.remove(System);
        //@ts-ignore
        if (system) system.onDisable();
    }

    /**
     * 清理所有数据
     */
    public clearAll() {
        this.systemManager.clear();
        this.entityManager.clear();
        this.componentManager.clear();
        this.singletions.length = 0;
    }

    private executeSystem(args: any[]) {
        this.systemManager.each(function (system) {
            system['execute'].apply(system, args);
        });
    }
    private beforeExecuteSystem(args: any[]) {
        this.systemManager.each(function (system) {
            system['timerExecute'](args);
            system['beforeExecute'].apply(system, args);
        });
    }
    private afterExecuteSystem(args: any[]) {
        this.systemManager.each(function (system) {
            system['afterExecute'].apply(system, args);
        });
    }

    private updateSystem(args: any[]) {
        this.systemManager.each(function (system) {
            system['update'].apply(system, args);
        });
    }
    private beforeUpdateSystem(args: any[]) {
        this.systemManager.each(function (system) {
            system['timerUpdate'](args);
            system['beforeUpdate'].apply(system, args);
        });
    }
    private afterUpdateSystem(args: any[]) {
        this.systemManager.each(function (system) {
            system['afterUpdate'].apply(system, args);
        });
    }

    /**
     * 一般由游戏循环驱动
     */
    public execute(...args: any[]) {
        this.beforeExecuteSystem(args);
        this.executeSystem(args);
        this.afterExecuteSystem(args);
    }

    /**
     * 等同于execute，一般情况下用不到，比如当需要区分逻辑帧与渲染帧时，用于渲染帧
     */
    public update(...args: any[]) {
        this.beforeUpdateSystem(args);
        this.updateSystem(args);
        this.afterUpdateSystem(args);
    }
}

class ECSManager extends ECS implements IECSManager {
    private ecss: Map<number, IECS> = new Map();

    public getECS(ecsID: number = 0): IECS {
        if (ecsID === 0) {
            return this;
        }
        if (!this.ecss.has(ecsID)) {
            this.ecss.set(ecsID, new ECS());
        }

        return this.ecss.get(ecsID);
    }

    public deleteECS(ecsID: number) {
        const ecs = this.ecss.get(ecsID);
        if (!ecs) return;
        ecs.clearAll();
        this.ecss.delete(ecsID);
    }

    public clearECSs() {
        this.ecss.forEach(ecs => ecs.clearAll());
        this.ecss.clear();
    }
}

export const ecs: IECSManager = new ECSManager();