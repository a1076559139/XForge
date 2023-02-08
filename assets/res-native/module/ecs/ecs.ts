import { EcsComponent } from "./EcsComponent";
import EcsEntity from "./EcsEntity";
import { EcsSystem } from "./EcsSystem";
import { NumberMap } from "./EcsUtils";

type IFlag = number[];
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

        if (this.index >= FlagBits * 30) {
            throw new Error(`当前Component的种类超过${FlagBits * 30}个`);
        }

        const flag: IFlag = new Array(FlagBits).fill(0);
        flag[(this.index / 30) >>> 0] = (1 << (this.index % 30));
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
        return Math.ceil(classManager.getComCount() / 30);
    }
}
export const flagManager = new FlagManager();

export abstract class EcsBase {
    /**类名 */
    static ecsClassName = 'EcsBase';
    /**类名 */
    public get ecsClassName() { return 'EcsBase'; }
    /**生效*/
    protected onEnable() { }
    /**失效*/
    protected onDisable() { }
}

/**
 * 类管理器
 */
class ClassManager {
    private sysCount = 0;
    private comCount = 0;
    private nameToSuperName: Map<string, string> = new Map();
    private nameToClass: Map<string, typeof EcsComponent | typeof EcsSystem> = new Map();
    /**
     * 获取父类
     */
    private getSuper<T extends typeof EcsBase>(type: T): T {
        if (!type || !type.prototype) return null;
        const proto = type.prototype; // binded function do not have prototype
        const dunderProto = proto && Object.getPrototypeOf(proto);
        return dunderProto && dunderProto.constructor;
    }

    add(ctor: typeof EcsComponent | typeof EcsSystem, className: string) {
        if (this.nameToClass.has(className)) {
            console.error(`[ecs] ${className}已存在`);
        }
        this.nameToClass.set(className, ctor);

        // 存储类名继承对应关系
        let superClss = this.getSuper(ctor);
        while (superClss && superClss !== EcsBase && superClss.ecsClassName !== 'EcsComponent' && superClss.ecsClassName !== 'EcsSystem') {
            this.nameToSuperName.set(className, superClss.ecsClassName);
            superClss = this.getSuper(ctor = superClss);
            className = ctor.ecsClassName;
        }

        if (superClss.ecsClassName === 'EcsComponent') {
            this.comCount++;
        } else if (superClss.ecsClassName === 'EcsSystem') {
            this.sysCount++;
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
    getComCount() {
        return this.comCount;
    }

    /**
     * 系统种类数量
     */
    getSysCount() {
        return this.sysCount;
    }
}
export const classManager = new ClassManager();

/**
 * EcsComponent与EcsSystem装饰器
 */
export function ecsclass(className: string) {
    return function fNOP(ctor: any) {
        // EcsName需要先初始化
        ctor.ecsClassName = className;
        classManager.add(ctor, className);
        return ctor;
    }
}

type IComponentName = string;
/**
 * 组件管理器
 */
class ComponentManager {
    private entities: Map<IComponentName, NumberMap<EcsEntity>> = new Map();

    private getEntities(name: IComponentName) {
        if (!this.entities.has(name)) {
            this.entities.set(name, new NumberMap());
        }
        return this.entities.get(name);
    }

    /**
     * 添加一个组件名对应的实体
     */
    addEntity(comName: IComponentName, entity: EcsEntity) {
        if (!comName) return;

        // 添加当前
        this.getEntities(comName).add(entity);

        // 添加基类
        this.addEntity(classManager.getSuperName(comName), entity);
    }

    /**
     * 移除一个组件名对应的实体
     */
    removeEntity(comName: IComponentName, entity: EcsEntity) {
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

    each(callback: (value: NumberMap<EcsEntity>) => void) {
        this.entities.forEach(function (value) {
            callback(value);
        })
    }

    clear() {
        this.entities.clear();
    }
}
type IEntityUUID = string;
/**
 * 实体管理器
 */
class EntityManager {
    private entities: Map<IEntityUUID, EcsEntity> = new Map();

    has(uuid: IEntityUUID) {
        return this.entities.get(uuid) || null;
    }

    add(entity: EcsEntity) {
        this.entities.set(entity.uuid, entity);
    }

    remove(entity: EcsEntity) {
        return this.entities.delete(entity.uuid);
    }

    get(uuid: IEntityUUID) {
        return this.entities.get(uuid) || null;
    }

    getAll(out: EcsEntity[]) {
        this.entities.forEach(entity => out.push(entity));
        return out;
    }

    each(callback: (value: EcsEntity) => void) {
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
    private systemNames: string[] = [];
    private systems: EcsSystem[] = [];

    /**
     * 添加系统
     */
    add(system: EcsSystem) {
        this.systems.push(system);
        this.systemNames.push(system.ecsClassName);
    }

    get(System: typeof EcsSystem) {
        const index = this.systemNames.indexOf(System.ecsClassName);
        return this.systems[index];
    }

    /**
     * 移除系统
     */
    remove(System: typeof EcsSystem) {
        const index = this.systemNames.indexOf(System.ecsClassName);
        if (index >= 0) {
            this.systemNames.splice(index, 1);
            return this.systems.splice(index, 1)[0] || null;
        }
        return null;
    }

    /**
     * 清空所有
     */
    clear() {
        this.systemNames.length = 0;
        this.systems.length = 0;
    }

    each(callback: (value: EcsSystem) => void) {
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
    any(...args: typeof EcsComponent[]): this
    /**
     * 必须包含所有这些组件
     */
    all(...args: typeof EcsComponent[]): this
    /**
     * 仅仅只有这些组件
     */
    only(...args: typeof EcsComponent[]): this
    /**
     * 不能包含其中的任何一个组件
     */
    exclude(...args: typeof EcsComponent[]): this
}

class Filter implements IFilter {
    static query(entityManager: EntityManager, componentManager: ComponentManager, filter: Filter) {
        let result: EcsEntity[] = [];
        if (!filter) return result;

        // 优先验证anys
        if (result.length === 0 && filter.anys.length !== 0) {
            filter.anys.forEach(comName => {
                const entities = componentManager.hasEntities(comName);
                if (entities && entities.size) entities.forEach((comCount, entity) => {
                    if (result.indexOf(entity) >= 0) return;
                    result.push(entity);
                })
            })
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

        let result: EcsEntity[] = [];

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
    private pipeline: ((entities: EcsEntity[]) => EcsEntity[])[] = [];

    constructor() {
        this.pipeline.push(function valid(entities: EcsEntity[]) {
            return entities.filter(entity => entity.isEntityValid);
        })
    }

    /**
     * 有这些组件中的任何一个
     */
    any(...coms: typeof EcsComponent[]) {
        if (coms.length === 0) return this;

        coms.forEach(com => {
            if (this.anys.indexOf(com.ecsClassName) >= 0) return;
            this.anys.push(com.ecsClassName);
        });

        return this;
    }
    /**
     * 必须包含所有这些组件
     */
    all(...coms: typeof EcsComponent[]) {
        if (coms.length === 0) return this;
        if (!this.include) this.include = coms[0].ecsClassName;

        let flag: IFlag = null;
        this.pipeline.push(function all(entities: EcsEntity[]) {
            if (!flag) flag = flagManager.getByNames(coms.map(com => com.ecsClassName));
            return entities.filter(entity => entity.checkFlagAll(flag));
        })
        return this;
    }
    /**
     * 仅仅只有这些组件
     */
    only(...coms: typeof EcsComponent[]) {
        if (coms.length === 0) return this;
        if (!this.include) this.include = coms[0].ecsClassName;

        let flag: IFlag = null;
        this.pipeline.push(function only(entities: EcsEntity[]) {
            if (!flag) flag = flagManager.getByNames(coms.map(com => com.ecsClassName));
            return entities.filter(entity => entity.checkFlagOnly(flag));
        })
        return this;
    }
    /**
     * 不能包含其中的任何一个组件
     */
    exclude(...coms: typeof EcsComponent[]) {
        if (coms.length === 0) return this;
        this.hasExclude = true;

        let flag: IFlag = null;
        this.pipeline.push(function only(entities: EcsEntity[]) {
            if (!flag) flag = flagManager.getByNames(coms.map(com => com.ecsClassName));
            return entities.filter(entity => !entity.checkFlagAny(flag));
        })

        return this;
    }
}

export class ECS {
    private entityManager = new EntityManager();
    private systemManager = new SystemManager();
    private componentManager = new ComponentManager();

    /**
     * 过滤条件
     */
    public get filter() {
        return new Filter();
    }

    /**
     * 查询实体
     */
    public query<T extends EcsEntity>(filter: IFilter): T[]
    public query<T extends EcsComponent>(filter: IFilter, Comment: { new(): T }): T[]
    public query<T>(filter: IFilter, Comment?: typeof EcsComponent): T[] {
        const entities = Filter.query(this.entityManager, this.componentManager, filter as any);
        if (!Comment) return entities as T[];
        return entities.map(entity => entity.getComponent(Comment)) as T[];
    }

    /**
     * 查询实体
     */
    public find<T extends EcsEntity>(filter: IFilter): T
    public find<T extends EcsComponent>(filter: IFilter, Comment: { new(): T }): T
    public find<T>(filter: IFilter, Comment?: typeof EcsComponent): T {
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
     * 添加一个实体
     */
    protected addEntity(entity: EcsEntity) {
        this.entityManager.add(entity);
        // 将实体的组件从组件管理器中移除
        entity['components'].forEach(component => {
            this.componentManager.addEntity(component.ecsClassName, component.entity);
        })
    }

    /**
     * 移除一个 
     */
    protected removeEntity(entity: EcsEntity) {
        // 将实体的组件添加进组件管理器中
        entity['components'].forEach(component => {
            this.componentManager.removeEntity(component.ecsClassName, component.entity);
        })
        this.entityManager.remove(entity);
    }

    /**
     * 添加一个组件
     */
    protected addComponent(entity: EcsEntity, component: EcsComponent, target?: any) {
        //@ts-ignore
        const result = entity.innerAddComponent(component, target) as boolean;
        if (!result) return false;

        this.componentManager.addEntity(component.ecsClassName, entity);
        return true;
    };

    /**
     * 移除一个组件
     */
    protected removeComponent(component: EcsComponent, target?: any) {
        const entity = component.entity;
        const componentName = component.ecsClassName;
        //@ts-ignore
        const result = entity.innerRemoveComponent(component, target) as boolean;
        if (!result) return false;

        this.componentManager.removeEntity(componentName, entity);
        return true;
    };

    /**
     * 根据类型获取单个EcsEntity
     */
    // public getEntity<T extends EcsEntity>(include: typeof EcsComponent | (typeof EcsComponent)[], exclude?: typeof EcsComponent | (typeof EcsComponent)[]): T {
    //     return this.getEntities<T>(include, exclude)[0];
    // }

    /**
     * 获取某个组件的集合
     */
    // public getComponents<T extends typeof EcsComponent>(include: T, exclude?: typeof EcsComponent | (typeof EcsComponent)[]): InstanceType<T>[] {
    //     return this.getEntities(include, exclude).map(entity => entity.getComponent(include)) as InstanceType<T>[];
    // }

    /**
     * 根据类型获取多个ecsEntity
     * @param include 包含 all
     * @param exclude 排除 some
     * @returns 
     */
    // public getEntities<T extends EcsEntity>(include: typeof EcsComponent | (typeof EcsComponent)[], exclude?: typeof EcsComponent | (typeof EcsComponent)[]): T[] {
    //     if (include instanceof Array) {
    //         if (!include.length) return [];

    //         const result = this.getEntities(include[0], exclude);
    //         const flags = flagManager.getByNames(include.map(com => com.ecsClassName));
    //         return result.filter(entity => entity.checkFlagAll(flags)) as T[];
    //     } else {
    //         if (!include) return [];

    //         const componentName = include.ecsClassName;
    //         const entities = this.componentManager.hasEntities(componentName);
    //         const result = entities ? Array.from(entities.keys()) as T[] : [];
    //         if (!exclude) return result;

    //         const flag = (exclude instanceof Array) ?
    //             flagManager.getByNames(exclude.map(com => com.ecsClassName)) :
    //             flagManager.getByName(exclude.ecsClassName);
    //         return result.filter(entity => {
    //             return entity.isEntityValid && !entity.checkFlagAny(flag);
    //         });
    //     }
    // };

    /**
    * 添加一个系统
    */
    public addSystem<T extends typeof EcsSystem>(System: T): InstanceType<T> {
        const system = new System();
        this.systemManager.add(system);
        system['onEnable']();
        return system as InstanceType<T>;
    }

    /**
     * 获取一个系统
     */
    public getSystem<T extends typeof EcsSystem>(System: T): InstanceType<T> {
        return this.systemManager.get(System) as InstanceType<T>;
    }

    /**
     * 移除一个系统
     */
    public removeSystem<T extends typeof EcsSystem>(System: T): InstanceType<T> {
        const system = this.systemManager.remove(System);
        if (system) system['onDisable']();
        return system as InstanceType<T>;
    }

    /**
     * 清理所有数据
     */
    public clearAll() {
        this.systemManager.clear();
        this.entityManager.clear();
        this.componentManager.clear();
    }

    private executeSystem(args: any[]) {
        this.systemManager.each(function (system) {
            system['execute'].apply(system, args);
        })
    }
    private beforeExecuteSystem(args: any[]) {
        this.systemManager.each(function (system) {
            system['timerExecute'](args);
            system['beforeExecute'].apply(system, args);
        })
    }
    private afterExecuteSystem(args: any[]) {
        this.systemManager.each(function (system) {
            system['afterExecute'].apply(system, args);
        })
    }

    private updateSystem(args: any[]) {
        this.systemManager.each(function (system) {
            system['update'].apply(system, args);
        })
    }
    private beforeUpdateSystem(args: any[]) {
        this.systemManager.each(function (system) {
            system['timerUpdate'](args);
            system['beforeUpdate'].apply(system, args);
        })
    }
    private afterUpdateSystem(args: any[]) {
        this.systemManager.each(function (system) {
            system['afterUpdate'].apply(system, args);
        })
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

class ECSManager extends ECS {
    private ecss: Map<string, ECS> = new Map();

    public getECS(ecsName: string): ECS {
        if (!ecsName || ecsName === 'default') {
            return this;
        }
        if (!this.ecss.has(ecsName)) {
            this.ecss.set(ecsName, new ECS());
        }

        return this.ecss.get(ecsName);
    }

    public deleteECS(ecsName: string) {
        const ecs = this.ecss.get(ecsName);
        if (!ecs) return;
        ecs.clearAll();
        this.ecss.delete(ecsName);
    }

    public clearECSs() {
        this.ecss.forEach(ecs => ecs.clearAll());
        this.ecss.clear();
    }
}

export const ecs = new ECSManager();